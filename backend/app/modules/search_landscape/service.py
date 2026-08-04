"""Service layer for the F03 Search Landscape Knowledge repository.

The service owns the governed sync pipeline: it imports the versioned seed
catalog, best-effort fetches the documentation sources (with automatic retry),
and never deletes prior knowledge — a failed import keeps the last approved
version and records correlation id / error / retry count in ``sync_history``.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ValidationException
from app.modules.search_landscape import seed_data
from app.modules.search_landscape.models import (
    ApprovalStatusEnum,
    KnowledgeSource,
    KnowledgeVersion,
    KnowledgeVersionEntityEnum,
    SearchAlgorithmUpdate,
    SearchKnowledge,
    SearchOperator,
    SerpFeature,
    SyncHistory,
    SyncStatusEnum,
)
from app.modules.search_landscape.repository import (
    AlgorithmUpdateRepository,
    KnowledgeSourceRepository,
    KnowledgeVersionRepository,
    SearchKnowledgeRepository,
    SearchOperatorRepository,
    SerpFeatureRepository,
    SyncHistoryRepository,
)
from app.modules.search_landscape.schemas import OverviewResponse

logger = logging.getLogger(__name__)

SYNC_SOURCE_TIMEOUT = httpx.Timeout(connect=5.0, read=10.0, write=10.0, pool=10.0)
SYNC_MAX_RETRIES = 3
SYNC_RETRY_BACKOFF_SECONDS = [1.0, 2.0, 3.0]


class SearchLandscapeService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.serp_repo = SerpFeatureRepository(db)
        self.algorithm_repo = AlgorithmUpdateRepository(db)
        self.operator_repo = SearchOperatorRepository(db)
        self.knowledge_repo = SearchKnowledgeRepository(db)
        self.version_repo = KnowledgeVersionRepository(db)
        self.source_repo = KnowledgeSourceRepository(db)
        self.sync_repo = SyncHistoryRepository(db)

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    async def get_overview(self) -> OverviewResponse:
        sources = await self.source_repo.list_all()
        latest_sync = await self.sync_repo.get_latest()
        latest_version = await self.db.execute(
            select(func.max(KnowledgeVersion.created_at))
        )
        last_version_created = latest_version.scalar_one()
        last_update = last_version_created or latest_sync.started_at if latest_sync else None

        total_rules = await self.knowledge_repo.count()
        total_serp = await self.serp_repo.count()
        pending = await self.knowledge_repo.count_pending_approval()
        pending += await self.algorithm_repo.count_pending_approval()
        alg_count = await self.algorithm_repo.count()

        return OverviewResponse(
            knowledge_version=self._latest_knowledge_version(sources),
            last_sync=latest_sync.started_at if latest_sync else None,
            last_update=last_update,
            total_search_rules=total_rules,
            total_serp_features=total_serp,
            supported_engines=list(seed_data.SUPPORTED_ENGINES),
            algorithm_updates=alg_count,
            pending_approvals=pending,
            sources=len(sources),
            markets=list(seed_data.MARKETS),
            devices=list(seed_data.DEVICES),
        )

    async def list_serp_features(self) -> List[SerpFeature]:
        return await self.serp_repo.list_all()

    async def list_algorithms(self) -> List[SearchAlgorithmUpdate]:
        return await self.algorithm_repo.list_all()

    async def list_operators(self) -> List[SearchOperator]:
        return await self.operator_repo.list_all()

    async def list_knowledge(self) -> List[SearchKnowledge]:
        return await self.knowledge_repo.list_all()

    async def list_documentation(self) -> List[KnowledgeSource]:
        return await self.source_repo.list_all()

    async def list_versions(self, limit: int = 200) -> List[KnowledgeVersion]:
        return await self.version_repo.list_all(limit=limit)

    async def list_sync_logs(self, limit: int = 100) -> List[SyncHistory]:
        return await self.sync_repo.list_all(limit=limit)

    @staticmethod
    def _latest_knowledge_version(sources: List[KnowledgeSource]) -> Optional[str]:
        versions = [s.version for s in sources if s.version]
        if not versions:
            return None
        # Highest dotted version wins (numeric comparison of parts).
        def _key(v: str) -> tuple:
            parts = []
            for p in v.split("."):
                try:
                    parts.append(int(p))
                except ValueError:
                    parts.append(0)
            return tuple(parts)

        return max(versions, key=_key)

    # ------------------------------------------------------------------
    # Sync pipeline
    # ------------------------------------------------------------------

    def _generate_correlation_id(self) -> str:
        return f"f03_{uuid.uuid4().hex[:12]}"

    async def run_sync(self, triggered_by: str = "system") -> SyncHistory:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()

        sync = SyncHistory(
            correlation_id=correlation_id,
            status=SyncStatusEnum.running,
            started_at=started_at,
            triggered_by=triggered_by,
        )
        self.db.add(sync)
        await self.db.flush()

        items_created = 0
        items_updated = 0
        retry_total = 0
        source_failures = 0
        errors: List[str] = []

        try:
            # 1) Ensure documentation sources exist (seeded on first run).
            await self._ensure_sources(correlation_id)

            # 2) Best-effort fetch of each source with automatic retry.
            sources = await self.source_repo.list_all()
            for source in sources:
                retries, error = await self._fetch_source(source, correlation_id)
                retry_total += retries
                if error:
                    source_failures += 1
                    errors.append(f"{source.name}: {error}")

            # 3) Import + version the governed catalog. Never deletes rows.
            c, u = await self._import_serp_features()
            items_created += c
            items_updated += u
            c, u = await self._import_algorithms()
            items_created += c
            items_updated += u
            c, u = await self._import_operators()
            items_created += c
            items_updated += u
            c, u = await self._import_knowledge()
            items_created += c
            items_updated += u

            await self.db.flush()

            # 4) Finalize the sync record.
            status = SyncStatusEnum.failed if source_failures == len(sources) and source_failures else SyncStatusEnum.partial
            if source_failures == 0:
                status = SyncStatusEnum.success
            sync.status = status
            sync.completed_at = datetime.utcnow()
            sync.duration_seconds = (sync.completed_at - started_at).total_seconds()
            sync.retry_count = retry_total
            sync.items_created = items_created
            sync.items_updated = items_updated
            sync.error = "; ".join(errors) if errors else None
            sync.details = {
                "sources_total": len(sources),
                "sources_failed": source_failures,
                "correlation_id": correlation_id,
            }
            await self.db.flush()
        except Exception as exc:  # noqa: BLE001 — surface as a failed sync run
            logger.exception("search landscape sync failed: %s", exc)
            sync.status = SyncStatusEnum.failed
            sync.completed_at = datetime.utcnow()
            sync.duration_seconds = (sync.completed_at - started_at).total_seconds()
            sync.error = f"{type(exc).__name__}: {exc}"
            await self.db.flush()
            raise

        return sync

    async def _ensure_sources(self, correlation_id: str) -> None:
        for spec in seed_data.SOURCES:
            existing = await self.source_repo.get_by_name(spec["name"])
            if existing:
                continue
            self.db.add(
                KnowledgeSource(
                    name=spec["name"],
                    url=spec["url"],
                    category=spec["category"],
                    status="active",
                    version="1.0.0",
                    correlation_id=correlation_id,
                )
            )
        await self.db.flush()

    async def _fetch_source(
        self, source: KnowledgeSource, correlation_id: str
    ) -> tuple[int, Optional[str]]:
        """Best-effort fetch of a documentation source with automatic retry.

        On failure we keep the last approved state and record error / retry /
        correlation id on the source (never delete prior knowledge).
        """
        last_error: Optional[str] = None
        attempts = 0
        for attempt in range(SYNC_MAX_RETRIES):
            attempts += 1
            try:
                async with httpx.AsyncClient(timeout=SYNC_SOURCE_TIMEOUT, follow_redirects=True) as client:
                    resp = await client.get(source.url, headers={"User-Agent": "NovaAI-F03-Sync/1.0"})
                resp.raise_for_status()
                await self.source_repo.record_sync_attempt(
                    source.id,
                    last_fetched_at=datetime.utcnow(),
                    success=True,
                    correlation_id=correlation_id,
                )
                await self.db.flush()
                return 0, None
            except Exception as exc:  # noqa: BLE001 — network failures are expected
                last_error = f"{type(exc).__name__}: {exc}"
                if attempt < SYNC_MAX_RETRIES - 1:
                    await asyncio.sleep(SYNC_RETRY_BACKOFF_SECONDS[attempt])
        await self.source_repo.record_sync_attempt(
            source.id,
            last_fetched_at=datetime.utcnow(),
            success=False,
            error=last_error,
            correlation_id=correlation_id,
        )
        await self.db.flush()
        return attempts, last_error

    # ------------------------------------------------------------------
    # Catalog import helpers (upsert + versioning, never delete)
    # ------------------------------------------------------------------

    @staticmethod
    def _content_hash(*fields: Any) -> str:
        payload = "|".join(
            json.dumps(f, sort_keys=True, default=str) if not isinstance(f, str) else f
            for f in fields
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _bump_version(current: str) -> str:
        parts = current.split(".")
        major = int(parts[0]) if parts and parts[0].isdigit() else 1
        minor = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 0
        patch = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 0
        patch += 1
        if patch >= 100:
            patch = 0
            minor += 1
        return f"{major}.{minor}.{patch}"

    def _snapshot(self, obj: Any, exclude: set[str] | None = None) -> Dict[str, Any]:
        """Serialize a model to a JSON-safe dict (for the JSONB snapshot)."""
        exclude = exclude or {"id", "created_at", "updated_at"}
        data: Dict[str, Any] = {}
        for col in obj.__table__.columns:
            if col.key in exclude:
                continue
            value = getattr(obj, col.key)
            if isinstance(value, datetime):
                value = value.isoformat()
            elif hasattr(value, "value"):  # enum
                value = value.value
            data[col.key] = value
        return data

    async def _record_version(
        self,
        entity_type: KnowledgeVersionEntityEnum,
        entity_id: UUID,
        snapshot: Dict[str, Any],
        change_summary: Optional[str],
        approval_status: ApprovalStatusEnum,
        source: Optional[str],
    ) -> None:
        latest = await self.version_repo.get_latest_version(entity_type.value, entity_id)
        version_num = (latest or 0) + 1
        self.db.add(
            KnowledgeVersion(
                entity_type=entity_type,
                entity_id=entity_id,
                version=version_num,
                change_summary=change_summary,
                snapshot=snapshot,
                approval_status=approval_status,
                source=source,
            )
        )

    async def _import_serp_features(self) -> tuple[int, int]:
        created = 0
        updated = 0
        for spec in seed_data.SERP_FEATURES:
            existing = await self.serp_repo.get_by_name(spec["name"])
            h = self._content_hash(spec.get("description"), spec.get("supported"), spec.get("documentation_url"))
            if existing is None:
                self.db.add(
                    SerpFeature(
                        name=spec["name"],
                        description=spec["description"],
                        supported=spec["supported"],
                        documentation_url=spec.get("documentation_url"),
                        search_engines=spec.get("search_engines"),
                        version="1.0.0",
                        source="seed",
                        approval_status=ApprovalStatusEnum.approved,
                    )
                )
                await self.db.flush()
                created += 1
            else:
                current_h = self._content_hash(
                    existing.description, existing.supported, existing.documentation_url
                )
                if current_h != h:
                    existing.description = spec["description"]
                    existing.supported = spec["supported"]
                    existing.documentation_url = spec.get("documentation_url")
                    existing.search_engines = spec.get("search_engines")
                    existing.version = self._bump_version(existing.version)
                    existing.updated_at = datetime.utcnow()
                    updated += 1
        await self.db.flush()
        # Write version snapshots for everything present after import.
        for feature in await self.serp_repo.list_all():
            snap = self._snapshot(feature)
            await self._record_version(
                KnowledgeVersionEntityEnum.serp_feature,
                feature.id,
                snap,
                change_summary="SERP feature catalog import",
                approval_status=feature.approval_status,
                source=feature.source,
            )
        return created, updated

    async def _import_algorithms(self) -> tuple[int, int]:
        created = 0
        updated = 0
        for spec in seed_data.ALGORITHM_UPDATES:
            existing = await self.algorithm_repo.get_by_name(spec["name"])
            h = self._content_hash(spec.get("summary"), spec.get("release_date"), spec.get("priority"), spec.get("status"))
            if existing is None:
                self.db.add(
                    SearchAlgorithmUpdate(
                        name=spec["name"],
                        release_date=spec.get("release_date"),
                        status=spec.get("status", "announced"),
                        summary=spec["summary"],
                        priority=spec.get("priority", "medium"),
                        documentation_url=spec.get("documentation_url"),
                        version="1.0.0",
                        source="seed",
                        # Algorithm interpretations require manual approval.
                        approval_status=ApprovalStatusEnum.pending,
                    )
                )
                await self.db.flush()
                created += 1
            else:
                current_h = self._content_hash(
                    existing.summary, existing.release_date, existing.priority, existing.status
                )
                if current_h != h:
                    existing.summary = spec["summary"]
                    existing.release_date = spec.get("release_date")
                    existing.priority = spec.get("priority", existing.priority)
                    existing.status = spec.get("status", existing.status)
                    existing.documentation_url = spec.get("documentation_url")
                    existing.version = self._bump_version(existing.version)
                    existing.updated_at = datetime.utcnow()
                    updated += 1
        await self.db.flush()
        for alg in await self.algorithm_repo.list_all():
            snap = self._snapshot(alg)
            await self._record_version(
                KnowledgeVersionEntityEnum.algorithm_update,
                alg.id,
                snap,
                change_summary="Algorithm update import",
                approval_status=alg.approval_status,
                source=alg.source,
            )
        return created, updated

    async def _import_operators(self) -> tuple[int, int]:
        created = 0
        updated = 0
        for spec in seed_data.SEARCH_OPERATORS:
            existing = await self.operator_repo.get_by_operator(spec["operator"])
            h = self._content_hash(spec.get("purpose"), spec.get("example"), spec.get("supported"))
            if existing is None:
                self.db.add(
                    SearchOperator(
                        operator=spec["operator"],
                        purpose=spec["purpose"],
                        example=spec.get("example"),
                        supported=spec["supported"],
                        search_engines=spec.get("search_engines"),
                        notes=spec.get("notes"),
                        version="1.0.0",
                        source="seed",
                        approval_status=ApprovalStatusEnum.approved,
                    )
                )
                await self.db.flush()
                created += 1
            else:
                current_h = self._content_hash(
                    existing.purpose, existing.example, existing.supported
                )
                if current_h != h:
                    existing.purpose = spec["purpose"]
                    existing.example = spec.get("example")
                    existing.supported = spec["supported"]
                    existing.search_engines = spec.get("search_engines")
                    existing.notes = spec.get("notes")
                    existing.version = self._bump_version(existing.version)
                    existing.updated_at = datetime.utcnow()
                    updated += 1
        await self.db.flush()
        for op in await self.operator_repo.list_all():
            snap = self._snapshot(op)
            await self._record_version(
                KnowledgeVersionEntityEnum.search_operator,
                op.id,
                snap,
                change_summary="Search operator import",
                approval_status=op.approval_status,
                source=op.source,
            )
        return created, updated

    async def _import_knowledge(self) -> tuple[int, int]:
        created = 0
        updated = 0
        for spec in seed_data.KNOWLEDGE_ITEMS:
            existing = await self.knowledge_repo.get_by_category_and_title(
                spec["category"], spec["title"]
            )
            h = self._content_hash(spec.get("content"), spec.get("summary"))
            if existing is None:
                self.db.add(
                    SearchKnowledge(
                        category=spec["category"],
                        title=spec["title"],
                        content=spec["content"],
                        summary=spec.get("summary"),
                        references=spec.get("references"),
                        priority=spec.get("priority", "medium"),
                        requires_approval=spec.get("requires_approval", False),
                        version="1.0.0",
                        source="seed",
                        # Interpretations / ranking recommendations need approval.
                        approval_status=(
                            ApprovalStatusEnum.pending
                            if spec.get("requires_approval")
                            else ApprovalStatusEnum.approved
                        ),
                    )
                )
                await self.db.flush()
                created += 1
            else:
                current_h = self._content_hash(existing.content, existing.summary)
                if current_h != h:
                    existing.content = spec["content"]
                    existing.summary = spec.get("summary")
                    existing.references = spec.get("references")
                    existing.priority = spec.get("priority", existing.priority)
                    existing.version = self._bump_version(existing.version)
                    existing.updated_at = datetime.utcnow()
                    updated += 1
        await self.db.flush()
        for item in await self.knowledge_repo.list_all():
            snap = self._snapshot(item)
            await self._record_version(
                KnowledgeVersionEntityEnum.knowledge,
                item.id,
                snap,
                change_summary="Knowledge item import",
                approval_status=item.approval_status,
                source=item.source,
            )
        return created, updated

    # ------------------------------------------------------------------
    # Manual approval workflow (HUMAN CONTROL)
    # ------------------------------------------------------------------

    async def approve(
        self, entity_type: str, entity_id: UUID, approved: bool, approved_by: str
    ) -> Dict[str, Any]:
        """Approve or reject a pending knowledge item / algorithm interpretation."""
        approval = ApprovalStatusEnum.approved if approved else ApprovalStatusEnum.rejected

        if entity_type in ("knowledge", "search_knowledge"):
            item = await self.knowledge_repo.get(entity_id)
            if not item:
                raise NotFoundException("search knowledge item", entity_id)
            if item.approval_status == approval:
                raise ValidationException(
                    f"item is already {approval.value}",
                    details={"id": str(entity_id)},
                )
            item.approval_status = approval
            item.updated_at = datetime.utcnow()
            await self.db.flush()
            await self._record_version(
                KnowledgeVersionEntityEnum.knowledge,
                item.id,
                self._snapshot(item),
                change_summary=f"Manual {'approval' if approved else 'rejection'} by {approved_by}",
                approval_status=approval,
                source=item.source,
            )
            await self.db.flush()
            return {"id": str(item.id), "approval_status": approval.value}

        if entity_type in ("algorithms", "algorithm_updates"):
            item = await self.algorithm_repo.get(entity_id)
            if not item:
                raise NotFoundException("algorithm update", entity_id)
            if item.approval_status == approval:
                raise ValidationException(
                    f"item is already {approval.value}",
                    details={"id": str(entity_id)},
                )
            item.approval_status = approval
            item.updated_at = datetime.utcnow()
            await self.db.flush()
            await self._record_version(
                KnowledgeVersionEntityEnum.algorithm_update,
                item.id,
                self._snapshot(item),
                change_summary=f"Manual {'approval' if approved else 'rejection'} by {approved_by}",
                approval_status=approval,
                source=item.source,
            )
            await self.db.flush()
            return {"id": str(item.id), "approval_status": approval.value}

        raise ValidationException(
            f"unsupported entity_type '{entity_type}'",
            details={"supported": ["knowledge", "algorithms"]},
        )
