"""Repositories for the F03 Search Landscape Knowledge module."""
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.shared.repositories.base_repository import BaseRepository
from app.modules.search_landscape.models import (
    SerpFeature,
    SearchAlgorithmUpdate,
    SearchOperator,
    SearchKnowledge,
    KnowledgeVersion,
    KnowledgeSource,
    SyncHistory,
)


class SerpFeatureRepository(BaseRepository[SerpFeature]):
    def __init__(self, db: AsyncSession):
        super().__init__(SerpFeature, db)

    async def get_by_name(self, name: str) -> Optional[SerpFeature]:
        result = await self.db.execute(
            select(SerpFeature).where(SerpFeature.name == name)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[SerpFeature]:
        result = await self.db.execute(select(SerpFeature).order_by(SerpFeature.name.asc()))
        return result.scalars().all()


class AlgorithmUpdateRepository(BaseRepository[SearchAlgorithmUpdate]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchAlgorithmUpdate, db)

    async def get_by_name(self, name: str) -> Optional[SearchAlgorithmUpdate]:
        result = await self.db.execute(
            select(SearchAlgorithmUpdate).where(SearchAlgorithmUpdate.name == name)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[SearchAlgorithmUpdate]:
        result = await self.db.execute(
            select(SearchAlgorithmUpdate).order_by(SearchAlgorithmUpdate.release_date.desc())
        )
        return result.scalars().all()

    async def count_pending_approval(self) -> int:
        from app.modules.search_landscape.models import ApprovalStatusEnum

        result = await self.db.execute(
            select(func.count())
            .select_from(SearchAlgorithmUpdate)
            .where(SearchAlgorithmUpdate.approval_status == ApprovalStatusEnum.pending)
        )
        return result.scalar_one()


class SearchOperatorRepository(BaseRepository[SearchOperator]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchOperator, db)

    async def get_by_operator(self, operator: str) -> Optional[SearchOperator]:
        result = await self.db.execute(
            select(SearchOperator).where(SearchOperator.operator == operator)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[SearchOperator]:
        result = await self.db.execute(select(SearchOperator).order_by(SearchOperator.operator.asc()))
        return result.scalars().all()


class SearchKnowledgeRepository(BaseRepository[SearchKnowledge]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchKnowledge, db)

    async def get_by_category_and_title(
        self, category: str, title: str
    ) -> Optional[SearchKnowledge]:
        result = await self.db.execute(
            select(SearchKnowledge).where(
                SearchKnowledge.category == category,
                SearchKnowledge.title == title,
            )
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[SearchKnowledge]:
        result = await self.db.execute(
            select(SearchKnowledge).order_by(SearchKnowledge.category.asc(), SearchKnowledge.title.asc())
        )
        return result.scalars().all()

    async def count_pending_approval(self) -> int:
        from app.modules.search_landscape.models import ApprovalStatusEnum

        result = await self.db.execute(
            select(func.count())
            .select_from(SearchKnowledge)
            .where(SearchKnowledge.approval_status == ApprovalStatusEnum.pending)
        )
        return result.scalar_one()


class KnowledgeVersionRepository(BaseRepository[KnowledgeVersion]):
    def __init__(self, db: AsyncSession):
        super().__init__(KnowledgeVersion, db)

    async def get_latest_version(self, entity_type: str, entity_id: UUID) -> Optional[int]:
        result = await self.db.execute(
            select(func.max(KnowledgeVersion.version))
            .where(
                KnowledgeVersion.entity_type == entity_type,
                KnowledgeVersion.entity_id == entity_id,
            )
        )
        return result.scalar_one()

    async def list_all(self, limit: int = 200) -> list[KnowledgeVersion]:
        result = await self.db.execute(
            select(KnowledgeVersion).order_by(KnowledgeVersion.created_at.desc()).limit(limit)
        )
        return result.scalars().all()


class KnowledgeSourceRepository(BaseRepository[KnowledgeSource]):
    def __init__(self, db: AsyncSession):
        super().__init__(KnowledgeSource, db)

    async def get_by_name(self, name: str) -> Optional[KnowledgeSource]:
        result = await self.db.execute(
            select(KnowledgeSource).where(KnowledgeSource.name == name)
        )
        return result.scalar_one_or_none()

    async def list_all(self) -> list[KnowledgeSource]:
        result = await self.db.execute(select(KnowledgeSource).order_by(KnowledgeSource.name.asc()))
        return result.scalars().all()

    async def record_sync_attempt(
        self,
        source_id: UUID,
        *,
        last_fetched_at,
        success: bool,
        error: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> None:
        """Update a source after a fetch attempt — bump retry_count on failure."""
        values: Dict[str, Any] = {"last_fetched_at": last_fetched_at}
        if success:
            values.update(
                {
                    "last_synced": last_fetched_at,
                    "retry_count": 0,
                    "error": None,
                    "correlation_id": correlation_id,
                }
            )
        else:
            values.update(
                {
                    "retry_count": KnowledgeSource.retry_count + 1,
                    "error": error,
                    "correlation_id": correlation_id,
                }
            )
        await self.db.execute(
            update(KnowledgeSource).where(KnowledgeSource.id == source_id).values(**values)
        )


class SyncHistoryRepository(BaseRepository[SyncHistory]):
    def __init__(self, db: AsyncSession):
        super().__init__(SyncHistory, db)

    async def get_latest(self) -> Optional[SyncHistory]:
        result = await self.db.execute(
            select(SyncHistory).order_by(SyncHistory.started_at.desc()).limit(1)
        )
        return result.scalar_one_or_none()

    async def list_all(self, limit: int = 100) -> list[SyncHistory]:
        result = await self.db.execute(
            select(SyncHistory).order_by(SyncHistory.started_at.desc()).limit(limit)
        )
        return result.scalars().all()
