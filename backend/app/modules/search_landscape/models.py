"""F03 Search Landscape Knowledge — governed search-knowledge repository.

Seven tables that store, version, and govern search-engine knowledge:

* ``serp_features``              — SERP feature catalog (Featured Snippets, ...)
* ``search_algorithm_updates``   — algorithm update history (Core Updates, ...)
* ``search_operators``           — normalized search operator library
* ``search_knowledge``           — governed knowledge items (ranking signals, ...)
* ``knowledge_versions``         — version history / source traceability
* ``knowledge_sources``          — documentation sources (Google/Bing docs, ...)
* ``sync_history``               — sync runs with correlation id / error / retry

The module is a knowledge source consumed by F04–F08. It performs no SEO
scoring, no crawling, no ranking analysis.
"""
from __future__ import annotations

import enum
import uuid
from datetime import datetime
from sqlalchemy import (
    String,
    Text,
    Integer,
    Float,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from app.core.database import Base


class KnowledgeItemStatusEnum(str, enum.Enum):
    active = "active"
    archived = "archived"


class ApprovalStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class AlgorithmStatusEnum(str, enum.Enum):
    announced = "announced"
    rolling_out = "rolling_out"
    completed = "completed"
    withdrawn = "withdrawn"


class AlgorithmPriorityEnum(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class KnowledgeCategoryEnum(str, enum.Enum):
    ranking_signals = "ranking_signals"
    indexing_rules = "indexing_rules"
    crawling_rules = "crawling_rules"
    structured_data = "structured_data"
    search_architecture = "search_architecture"
    algorithm_knowledge = "algorithm_knowledge"


class SourceStatusEnum(str, enum.Enum):
    active = "active"
    paused = "paused"
    failed = "failed"


class SyncStatusEnum(str, enum.Enum):
    running = "running"
    success = "success"
    partial = "partial"
    failed = "failed"


class KnowledgeVersionEntityEnum(str, enum.Enum):
    serp_feature = "serp_feature"
    algorithm_update = "algorithm_update"
    search_operator = "search_operator"
    knowledge = "knowledge"


class SerpFeature(Base):
    """Catalog entry for a SERP feature (Featured Snippets, AI Overview, ...)."""

    __tablename__ = "serp_features"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    supported: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    documentation_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    search_engines: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    markets: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    devices: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[KnowledgeItemStatusEnum] = mapped_column(
        Enum(KnowledgeItemStatusEnum), default=KnowledgeItemStatusEnum.active, index=True
    )
    approval_status: Mapped[ApprovalStatusEnum] = mapped_column(
        Enum(ApprovalStatusEnum), default=ApprovalStatusEnum.approved, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    source_ref: Mapped["KnowledgeSource | None"] = relationship("KnowledgeSource")

    __table_args__ = (
        Index("ix_serp_features_status", "status"),
    )


class SearchAlgorithmUpdate(Base):
    """An algorithm update record (Core Updates, Spam Updates, ...)."""

    __tablename__ = "search_algorithm_updates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    release_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[AlgorithmStatusEnum] = mapped_column(
        Enum(AlgorithmStatusEnum), default=AlgorithmStatusEnum.announced, index=True
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[AlgorithmPriorityEnum] = mapped_column(
        Enum(AlgorithmPriorityEnum), default=AlgorithmPriorityEnum.medium, index=True
    )
    documentation_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="SET NULL"), nullable=True
    )
    item_status: Mapped[KnowledgeItemStatusEnum] = mapped_column(
        Enum(KnowledgeItemStatusEnum), default=KnowledgeItemStatusEnum.active, index=True
    )
    approval_status: Mapped[ApprovalStatusEnum] = mapped_column(
        Enum(ApprovalStatusEnum), default=ApprovalStatusEnum.pending, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    source_ref: Mapped["KnowledgeSource | None"] = relationship("KnowledgeSource")

    __table_args__ = (
        Index("ix_algorithm_updates_status", "status"),
        Index("ix_algorithm_updates_priority", "priority"),
    )


class SearchOperator(Base):
    """A normalized search operator (site:, intitle:, ...)."""

    __tablename__ = "search_operators"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    operator: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)
    example: Mapped[str | None] = mapped_column(String(500), nullable=True)
    supported: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    search_engines: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[KnowledgeItemStatusEnum] = mapped_column(
        Enum(KnowledgeItemStatusEnum), default=KnowledgeItemStatusEnum.active, index=True
    )
    approval_status: Mapped[ApprovalStatusEnum] = mapped_column(
        Enum(ApprovalStatusEnum), default=ApprovalStatusEnum.approved, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    source_ref: Mapped["KnowledgeSource | None"] = relationship("KnowledgeSource")

    __table_args__ = (
        Index("ix_search_operators_status", "status"),
    )


class SearchKnowledge(Base):
    """A governed knowledge item (ranking signals, indexing rules, ...)."""

    __tablename__ = "search_knowledge"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category: Mapped[KnowledgeCategoryEnum] = mapped_column(
        Enum(KnowledgeCategoryEnum), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    references: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    priority: Mapped[AlgorithmPriorityEnum] = mapped_column(
        Enum(AlgorithmPriorityEnum), default=AlgorithmPriorityEnum.medium, index=True
    )
    requires_approval: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[KnowledgeItemStatusEnum] = mapped_column(
        Enum(KnowledgeItemStatusEnum), default=KnowledgeItemStatusEnum.active, index=True
    )
    approval_status: Mapped[ApprovalStatusEnum] = mapped_column(
        Enum(ApprovalStatusEnum), default=ApprovalStatusEnum.approved, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    source_ref: Mapped["KnowledgeSource | None"] = relationship("KnowledgeSource")

    __table_args__ = (
        Index("ix_search_knowledge_category", "category"),
        Index("ix_search_knowledge_title", "title"),
        Index("ix_search_knowledge_status", "status"),
    )


class KnowledgeVersion(Base):
    """Version-history / source-traceability row written on every import or update."""

    __tablename__ = "knowledge_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type: Mapped[KnowledgeVersionEntityEnum] = mapped_column(
        Enum(KnowledgeVersionEntityEnum), nullable=False, index=True
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    change_summary: Mapped[str | None] = mapped_column(String(500), nullable=True)
    snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[KnowledgeItemStatusEnum] = mapped_column(
        Enum(KnowledgeItemStatusEnum), default=KnowledgeItemStatusEnum.active, index=True
    )
    approval_status: Mapped[ApprovalStatusEnum] = mapped_column(
        Enum(ApprovalStatusEnum), default=ApprovalStatusEnum.approved, index=True
    )
    source: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_knowledge_versions_entity", "entity_type", "entity_id"),
        Index("ix_knowledge_versions_created", "created_at"),
    )


class KnowledgeSource(Base):
    """Documentation source (Google Search Central, Bing Webmaster, ...)."""

    __tablename__ = "knowledge_sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[SourceStatusEnum] = mapped_column(
        Enum(SourceStatusEnum), default=SourceStatusEnum.active, index=True
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    last_synced: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_reviewed: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    correlation_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    last_fetched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_knowledge_sources_status", "status"),
    )


class SyncHistory(Base):
    """A sync run record with correlation id, error, retry count and timestamp."""

    __tablename__ = "sync_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    correlation_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[SyncStatusEnum] = mapped_column(
        Enum(SyncStatusEnum), default=SyncStatusEnum.running, index=True
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    items_created: Mapped[int] = mapped_column(Integer, default=0)
    items_updated: Mapped[int] = mapped_column(Integer, default=0)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    triggered_by: Mapped[str | None] = mapped_column(String(100), nullable=True)

    __table_args__ = (
        Index("ix_sync_history_status", "status"),
        Index("ix_sync_history_started", "started_at"),
    )
