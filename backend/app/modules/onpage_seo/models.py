import enum
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, Float, Boolean, DateTime, Enum, ForeignKey, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.core.database import Base


class SEOStatusEnum(str, enum.Enum):
    scanned = "scanned"
    error = "error"
    pending = "pending"
    skipped = "skipped"


class AuditSeverityEnum(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class AuditStatusEnum(str, enum.Enum):
    passed = "passed"
    failed = "failed"
    warning = "warning"


class KeywordType(str, enum.Enum):
    primary = "primary"
    secondary = "secondary"
    missing = "missing"
    opportunity = "opportunity"


class KeywordStatus(str, enum.Enum):
    optimal = "optimal"
    underused = "underused"
    overused = "overused"
    missing = "missing"


class RecommendationPriority(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class RecommendationDifficulty(str, enum.Enum):
    easy = "easy"
    moderate = "moderate"
    hard = "hard"


class RecommendationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"


class ScanStatusEnum(str, enum.Enum):
    running = "running"
    completed = "completed"
    failed = "failed"


class LogTypeEnum(str, enum.Enum):
    audit = "audit"
    api = "api"
    validation = "validation"
    processing = "processing"
    error = "error"
    warning = "warning"


class SEOPage(Base):
    __tablename__ = "onpage_seo_pages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(2000), nullable=False)
    path: Mapped[str] = mapped_column(String(2000), nullable=True)
    seo_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[SEOStatusEnum] = mapped_column(Enum(SEOStatusEnum), nullable=False, default=SEOStatusEnum.pending)
    primary_keyword: Mapped[str | None] = mapped_column(String(500), nullable=True)
    word_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    readability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    has_schema: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_canonical: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_indexed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    meta_title: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    h1_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    h2_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    h3_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    images_missing_alt: Mapped[int | None] = mapped_column(Integer, nullable=True)
    internal_links_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    external_links_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    broken_links_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    audit_findings: Mapped[list["SEOAuditFinding"]] = relationship("SEOAuditFinding", back_populates="page", cascade="all, delete-orphan")
    keywords: Mapped[list["SEOKeyword"]] = relationship("SEOKeyword", back_populates="page", cascade="all, delete-orphan")
    meta_tags: Mapped[list["SEMetaTag"]] = relationship("SEMetaTag", back_populates="page", cascade="all, delete-orphan")
    headings: Mapped[list["SEHeading"]] = relationship("SEHeading", back_populates="page", cascade="all, delete-orphan")
    content: Mapped[list["SEContent"]] = relationship("SEContent", back_populates="page", cascade="all, delete-orphan")
    images: Mapped[list["SEImage"]] = relationship("SEImage", back_populates="page", cascade="all, delete-orphan")
    internal_links: Mapped[list["SEInternalLink"]] = relationship("SEInternalLink", back_populates="page", cascade="all, delete-orphan")
    external_links: Mapped[list["SEExternalLink"]] = relationship("SEExternalLink", back_populates="page", cascade="all, delete-orphan")
    canonical: Mapped[list["SECanonical"]] = relationship("SECanonical", back_populates="page", cascade="all, delete-orphan")
    robots_entries: Mapped[list["SERobots"]] = relationship("SERobots", back_populates="page", cascade="all, delete-orphan")
    sitemap_entries: Mapped[list["SESitemap"]] = relationship("SESitemap", back_populates="page", cascade="all, delete-orphan")
    schema_entries: Mapped[list["SESchema"]] = relationship("SESchema", back_populates="page", cascade="all, delete-orphan")
    answer_readiness: Mapped[list["SEAnswerReadiness"]] = relationship("SEAnswerReadiness", back_populates="page", cascade="all, delete-orphan")
    recommendations: Mapped[list["SERecommendation"]] = relationship("SERecommendation", back_populates="page", cascade="all, delete-orphan")
    history: Mapped[list["SEOHistoryEntry"]] = relationship("SEOHistoryEntry", back_populates="page", cascade="all, delete-orphan")
    logs: Mapped[list["SEOLogsEntry"]] = relationship("SEOLogsEntry", back_populates="page", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_onpage_seo_pages_website_id", "website_id"),
        Index("ix_onpage_seo_pages_url", "url"),
        Index("ix_onpage_seo_pages_status", "status"),
        Index("ix_onpage_seo_pages_seo_score", "seo_score"),
    )


class SEOAuditFinding(Base):
    __tablename__ = "onpage_seo_audit_findings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    check_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[AuditStatusEnum] = mapped_column(Enum(AuditStatusEnum), nullable=False)
    severity: Mapped[AuditSeverityEnum] = mapped_column(Enum(AuditSeverityEnum), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    element: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    expected_value: Mapped[str | None] = mapped_column(String(500), nullable=True)
    actual_value: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="audit_findings")

    __table_args__ = (
        Index("ix_onpage_seo_findings_page", "page_id"),
        Index("ix_onpage_seo_findings_category", "category"),
        Index("ix_onpage_seo_findings_severity", "severity"),
    )


class SEOKeyword(Base):
    __tablename__ = "onpage_seo_keywords"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    keyword_text: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[KeywordType] = mapped_column(Enum(KeywordType), nullable=False)
    density: Mapped[float | None] = mapped_column(Float, nullable=True)
    placement: Mapped[str | None] = mapped_column(String(100), nullable=True)
    occurrences: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recommended_density: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[KeywordStatus] = mapped_column(Enum(KeywordStatus), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="keywords")

    __table_args__ = (
        Index("ix_onpage_seo_keywords_page", "page_id"),
        Index("ix_onpage_seo_keywords_text", "keyword_text"),
    )


class SEMetaTag(Base):
    __tablename__ = "onpage_seo_meta_tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    tag_type: Mapped[str] = mapped_column(String(50), nullable=False)
    tag_name: Mapped[str] = mapped_column(String(100), nullable=False)
    tag_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_present: Mapped[bool] = mapped_column(Boolean, nullable=False)
    length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_length: Mapped[int] = mapped_column(Integer, nullable=False)
    is_valid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="meta_tags")

    __table_args__ = (
        Index("ix_onpage_seo_meta_page", "page_id"),
        Index("ix_onpage_seo_meta_tag_type", "tag_type"),
    )


class SEHeading(Base):
    __tablename__ = "onpage_seo_headings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_missing: Mapped[bool] = mapped_column(Boolean, nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="headings")

    __table_args__ = (
        Index("ix_onpage_seo_headings_page", "page_id"),
        Index("ix_onpage_seo_headings_level", "level"),
    )


class SEContent(Base):
    __tablename__ = "onpage_seo_content"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    word_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    paragraph_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    avg_paragraph_length: Mapped[float | None] = mapped_column(Float, nullable=True)
    readability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    readability_grade: Mapped[str | None] = mapped_column(String(10), nullable=True)
    has_duplicate_content: Mapped[bool] = mapped_column(Boolean, nullable=False)
    has_thin_content: Mapped[bool] = mapped_column(Boolean, nullable=False)
    content_freshness_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    grammar_issues: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_suggestions: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="content")

    __table_args__ = (
        Index("ix_onpage_seo_content_page", "page_id"),
    )


class SEImage(Base):
    __tablename__ = "onpage_seo_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    src: Mapped[str] = mapped_column(String(2000), nullable=False)
    alt_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    has_alt: Mapped[bool] = mapped_column(Boolean, nullable=False)
    file_size_kb: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_compressed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    uses_lazy_loading: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_responsive: Mapped[bool] = mapped_column(Boolean, nullable=False)
    format: Mapped[str | None] = mapped_column(String(20), nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="images")

    __table_args__ = (
        Index("ix_onpage_seo_images_page", "page_id"),
    )


class SEInternalLink(Base):
    __tablename__ = "onpage_seo_internal_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    target_url: Mapped[str] = mapped_column(String(2000), nullable=False)
    anchor_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_broken: Mapped[bool] = mapped_column(Boolean, nullable=False)
    link_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="internal_links")

    __table_args__ = (
        Index("ix_onpage_seo_internal_links_page", "page_id"),
        Index("ix_onpage_seo_internal_links_target", "target_url"),
    )


class SEExternalLink(Base):
    __tablename__ = "onpage_seo_external_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    target_url: Mapped[str] = mapped_column(String(2000), nullable=False)
    is_broken: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_nofollow: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_sponsored: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_ugc: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="external_links")

    __table_args__ = (
        Index("ix_onpage_seo_external_links_page", "page_id"),
        Index("ix_onpage_seo_external_links_target", "target_url"),
    )


class SECanonical(Base):
    __tablename__ = "onpage_seo_canonical"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    canonical_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    is_present: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_valid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_duplicate: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="canonical")

    __table_args__ = (
        Index("ix_onpage_seo_canonical_page", "page_id"),
    )


class SERobots(Base):
    __tablename__ = "onpage_seo_robots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    robots_txt_present: Mapped[bool] = mapped_column(Boolean, nullable=False)
    robots_meta: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_noindex: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_nofollow: Mapped[bool] = mapped_column(Boolean, nullable=False)
    blocked_resources: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="robots_entries")

    __table_args__ = (
        Index("ix_onpage_seo_robots_page", "page_id"),
    )


class SESitemap(Base):
    __tablename__ = "onpage_seo_sitemap"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    sitemap_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    is_present: Mapped[bool] = mapped_column(Boolean, nullable=False)
    page_in_sitemap: Mapped[bool] = mapped_column(Boolean, nullable=False)
    last_submitted: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_status: Mapped[str] = mapped_column(String(20), nullable=False, default="unknown")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="sitemap_entries")

    __table_args__ = (
        Index("ix_onpage_seo_sitemap_page", "page_id"),
    )


class SESchema(Base):
    __tablename__ = "onpage_seo_schema"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    schema_type: Mapped[str] = mapped_column(String(100), nullable=False)
    is_present: Mapped[bool] = mapped_column(Boolean, nullable=False)
    is_valid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    error_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warning_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    warnings: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="schema_entries")

    __table_args__ = (
        Index("ix_onpage_seo_schema_page", "page_id"),
        Index("ix_onpage_seo_schema_type", "schema_type"),
    )


class SEAnswerReadiness(Base):
    __tablename__ = "onpage_seo_answer_readiness"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    is_featured_snippet_ready: Mapped[bool] = mapped_column(Boolean, nullable=False)
    faq_optimized: Mapped[bool] = mapped_column(Boolean, nullable=False)
    ai_search_readiness_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    voice_search_optimized: Mapped[bool] = mapped_column(Boolean, nullable=False)
    question_coverage_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    has_structured_answers: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="answer_readiness")

    __table_args__ = (
        Index("ix_onpage_seo_answer_page", "page_id"),
    )


class SERecommendation(Base):
    __tablename__ = "onpage_seo_recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[RecommendationPriority] = mapped_column(Enum(RecommendationPriority), nullable=False)
    impact: Mapped[str] = mapped_column(String(200), nullable=False)
    estimated_traffic_gain: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_ranking_improvement: Mapped[float | None] = mapped_column(Float, nullable=True)
    difficulty: Mapped[RecommendationDifficulty] = mapped_column(Enum(RecommendationDifficulty), nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[RecommendationStatus] = mapped_column(Enum(RecommendationStatus), nullable=False, default=RecommendationStatus.pending)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="recommendations")

    __table_args__ = (
        Index("ix_onpage_seo_rec_page", "page_id"),
        Index("ix_onpage_seo_rec_priority", "priority"),
        Index("ix_onpage_seo_rec_status", "status"),
    )


class SEOHistoryEntry(Base):
    __tablename__ = "onpage_seo_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    scan_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[ScanStatusEnum] = mapped_column(Enum(ScanStatusEnum), nullable=False)
    findings_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    score_before: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_after: Mapped[int | None] = mapped_column(Integer, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    correlation_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="history")

    __table_args__ = (
        Index("ix_onpage_seo_history_page", "page_id"),
        Index("ix_onpage_seo_history_status", "status"),
        Index("ix_onpage_seo_history_started", "started_at"),
    )


class SEOLogsEntry(Base):
    __tablename__ = "onpage_seo_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    page_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("onpage_seo_pages.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[LogTypeEnum] = mapped_column(Enum(LogTypeEnum), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    correlation_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    page: Mapped["SEOPage"] = relationship("SEOPage", back_populates="logs")

    __table_args__ = (
        Index("ix_onpage_seo_logs_page", "page_id"),
        Index("ix_onpage_seo_logs_type", "type"),
        Index("ix_onpage_seo_logs_timestamp", "timestamp"),
    )