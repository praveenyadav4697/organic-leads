import enum
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, Float, Boolean, DateTime, Enum, ForeignKey, Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.core.database import Base


class PropertyTypeEnum(str, enum.Enum):
    website = "website"
    youtube_channel = "youtube_channel"
    app = "app"


class PermissionLevelEnum(str, enum.Enum):
    site_full = "siteFull"
    site_read = "siteRead"
    site_read_private = "siteReadPrivate"
    site_owner = "siteOwner"
    account_full = "accountFull"
    account_read = "accountRead"


class SiteOwnershipEnum(str, enum.Enum):
    sole = "sole"
    partial = "partial"
    multiple = "multiple"
    unverified = "unverified"


class VerificationMethodEnum(str, enum.Enum):
    dns = "dns"
    html = "html"
    html_tag = "html_tag"
    google_analytics = "google_analytics"
    google_tag_manager = "google_tag_manager"
    dns_cloud = "dns_cloud"
    dns_cpanel = "dns_cpanel"
    dns_gh = "dns_gh"
    dns_go = "dns_go"
    dns_aws = "dns_aws"
    dns_registrar = "dns_registrar"


class ConnectionStatusEnum(str, enum.Enum):
    connected = "connected"
    disconnected = "disconnected"
    pending = "pending"
    pending_verification = "pending-verification"
    error = "error"


class SyncStatusEnum(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    partial = "partial"


class AlertTypeEnum(str, enum.Enum):
    sync_failed = "sync_failed"
    sync_dead_job = "sync_dead_job"
    credential_expiring = "credential_expiring"
    credential_revoked = "credential_revoked"
    data_stale = "data_stale"


class AlertSeverityEnum(str, enum.Enum):
    info = "info"
    warning = "warning"
    critical = "critical"


class AlertStatusEnum(str, enum.Enum):
    open = "open"
    acknowledged = "acknowledged"
    resolved = "resolved"


class CoverageStatusEnum(str, enum.Enum):
    indexed = "indexed"
    not_indexed = "not_indexed"
    excluded = "excluded"
    error = "error"
    submitted = "submitted"
    unknown = "unknown"


class SearchConsoleProperty(Base):
    __tablename__ = "search_console_properties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[str] = mapped_column(String(500), nullable=False)
    property_name: Mapped[str] = mapped_column(String(255), nullable=False)
    property_type: Mapped[PropertyTypeEnum] = mapped_column(Enum(PropertyTypeEnum), nullable=False)
    site_url: Mapped[str] = mapped_column(String(500), nullable=False)
    permission_level: Mapped[PermissionLevelEnum] = mapped_column(Enum(PermissionLevelEnum), nullable=False)
    site_ownership: Mapped[SiteOwnershipEnum] = mapped_column(Enum(SiteOwnershipEnum), nullable=False)
    verification_method: Mapped[VerificationMethodEnum | None] = mapped_column(Enum(VerificationMethodEnum), nullable=True)
    connection_status: Mapped[ConnectionStatusEnum] = mapped_column(Enum(ConnectionStatusEnum), nullable=False, default=ConnectionStatusEnum.pending)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sync_status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    sync_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    credentials: Mapped[list["SearchConsoleCredential"]] = relationship("SearchConsoleCredential", back_populates="property", cascade="all, delete-orphan")
    url_inspections: Mapped[list["UrlInspectionResult"]] = relationship("UrlInspectionResult", back_populates="property", cascade="all, delete-orphan")
    sitemaps: Mapped[list["SearchConsoleSitemap"]] = relationship("SearchConsoleSitemap", back_populates="property", cascade="all, delete-orphan")
    manual_actions: Mapped[list["SearchConsoleManualAction"]] = relationship("SearchConsoleManualAction", back_populates="property", cascade="all, delete-orphan")
    crawl_errors: Mapped[list["SearchConsoleCrawlError"]] = relationship("SearchConsoleCrawlError", back_populates="property", cascade="all, delete-orphan")
    enhancements: Mapped[list["SearchConsoleEnhancement"]] = relationship("SearchConsoleEnhancement", back_populates="property", cascade="all, delete-orphan")
    performance_reports: Mapped[list["SearchConsolePerformanceReport"]] = relationship("SearchConsolePerformanceReport", back_populates="property", cascade="all, delete-orphan")
    audit_logs: Mapped[list["SearchConsoleAuditLog"]] = relationship("SearchConsoleAuditLog", back_populates="property", cascade="all, delete-orphan")
    sync_jobs: Mapped[list["SearchConsoleSyncJob"]] = relationship("SearchConsoleSyncJob", back_populates="property", cascade="all, delete-orphan")
    alerts: Mapped[list["SearchConsoleAlert"]] = relationship("SearchConsoleAlert", back_populates="property", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_sc_properties_property_id", "property_id"),
        Index("ix_sc_properties_connection_status", "connection_status"),
        Index("ix_sc_properties_is_verified", "is_verified"),
        Index("ix_sc_properties_last_sync", "last_sync_at"),
    )


class SearchConsoleCredential(Base):
    __tablename__ = "search_console_credentials"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="CASCADE"), nullable=False)
    encrypted_access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    encrypted_refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    token_type: Mapped[str] = mapped_column(String(50), nullable=False, default="Bearer")
    scope: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    refresh_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    token_version: Mapped[int] = mapped_column(Integer, default=1)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="credentials")

    __table_args__ = (
        Index("ix_sc_credentials_property_id", "property_id"),
        Index("ix_sc_credentials_expires_at", "expires_at"),
    )


class UrlInspectionResult(Base):
    __tablename__ = "search_console_url_inspections"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="CASCADE"), nullable=False)
    inspected_url: Mapped[str] = mapped_column(String(2000), nullable=False)
    coverage_status: Mapped[str] = mapped_column(String(100), nullable=False, default="unknown")
    last_crawl_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    crawl_error_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    page_is_indexable: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_json_ld: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    has_microdata: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_roboted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_noindex: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    is_unreachable: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    inspection_result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    inspected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="url_inspections")

    __table_args__ = (
        Index("ix_sc_inspections_property_url", "property_id", "inspected_url"),
        Index("ix_sc_inspections_inspected_at", "inspected_at"),
    )


class SearchConsoleSitemap(Base):
    __tablename__ = "search_console_sitemaps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="CASCADE"), nullable=False)
    site_url: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, default="sitemap")
    is_pending_sitemap: Mapped[bool] = mapped_column(Boolean, default=False)
    path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_index_notify_allowed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_downloaded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    warnings_count: Mapped[int] = mapped_column(Integer, default=0)
    errors_count: Mapped[int] = mapped_column(Integer, default=0)
    contents: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="sitemaps")

    __table_args__ = (
        Index("ix_sc_sitemaps_property_id", "property_id"),
        Index("ix_sc_sitemaps_type", "type"),
    )


class SearchConsoleManualAction(Base):
    __tablename__ = "search_console_manual_actions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="CASCADE"), nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    action_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    sites_affected: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    is_partial: Mapped[bool] = mapped_column(Boolean, default=False)
    resolution: Mapped[str] = mapped_column(String(100), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="manual_actions")

    __table_args__ = (
        Index("ix_sc_manual_actions_property_id", "property_id"),
        Index("ix_sc_manual_actions_resolution", "resolution"),
    )


class SearchConsoleCrawlError(Base):
    __tablename__ = "search_console_crawl_errors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False, default="web")
    error_type: Mapped[str] = mapped_column(String(100), nullable=False)
    error_sub_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    page_url: Mapped[str] = mapped_column(String(2000), nullable=False)
    referring_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="crawl_errors")

    __table_args__ = (
        Index("ix_sc_crawl_errors_property_id", "property_id"),
        Index("ix_sc_crawl_errors_error_type", "error_type"),
        Index("ix_sc_crawl_errors_detected_at", "detected_at"),
    )


class SearchConsoleEnhancement(Base):
    __tablename__ = "search_console_enhancements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="CASCADE"), nullable=False)
    enhancement_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    items_count: Mapped[int] = mapped_column(Integer, default=0)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="enhancements")

    __table_args__ = (
        Index("ix_sc_enhancements_property_id", "property_id"),
        Index("ix_sc_enhancements_type", "enhancement_type"),
    )


class SearchConsolePerformanceReport(Base):
    __tablename__ = "search_console_performance_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="CASCADE"), nullable=False)
    start_date: Mapped[str] = mapped_column(String(20), nullable=False)
    end_date: Mapped[str] = mapped_column(String(20), nullable=False)
    dimensions: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    metrics: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    rows: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    row_limit: Mapped[int] = mapped_column(Integer, default=1000)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="performance_reports")

    __table_args__ = (
        Index("ix_sc_perf_reports_property_id", "property_id"),
        Index("ix_sc_perf_reports_date_range", "start_date", "end_date"),
    )


class SearchConsoleAuditLog(Base):
    __tablename__ = "search_console_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    actor: Mapped[str] = mapped_column(String(255), nullable=False, default="system")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="success")
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_sc_audit_property_id", "property_id"),
        Index("ix_sc_audit_action", "action"),
        Index("ix_sc_audit_created_at", "created_at"),
    )


class SearchConsoleSyncJob(Base):
    __tablename__ = "search_console_sync_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="CASCADE"), nullable=False)
    sync_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[SyncStatusEnum] = mapped_column(Enum(SyncStatusEnum), nullable=False, default=SyncStatusEnum.queued)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_dead: Mapped[bool] = mapped_column(Boolean, default=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="sync_jobs")

    __table_args__ = (
        Index("ix_sc_sync_jobs_property_id", "property_id"),
        Index("ix_sc_sync_jobs_status", "status"),
        Index("ix_sc_sync_jobs_started_at", "started_at"),
        Index("ix_sc_sync_jobs_next_retry_at", "next_retry_at"),
    )


class SearchConsoleAlert(Base):
    """Monitoring alert raised for Sync/credential/staleness conditions.

    Alerts are deduplicated by ``(property_id, alert_type)`` while open:
    re-raising the same condition updates the existing open alert instead of
    creating duplicates. Operators acknowledge/resolve them through the API.
    """

    __tablename__ = "search_console_alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("search_console_properties.id", ondelete="SET NULL"), nullable=True)
    alert_type: Mapped[AlertTypeEnum] = mapped_column(Enum(AlertTypeEnum), nullable=False)
    severity: Mapped[AlertSeverityEnum] = mapped_column(Enum(AlertSeverityEnum), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AlertStatusEnum] = mapped_column(Enum(AlertStatusEnum), nullable=False, default=AlertStatusEnum.open)
    occurrence_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    acknowledged_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    property: Mapped["SearchConsoleProperty"] = relationship("SearchConsoleProperty", back_populates="alerts")

    __table_args__ = (
        Index("ix_sc_alerts_property_id", "property_id"),
        Index("ix_sc_alerts_type", "alert_type"),
        Index("ix_sc_alerts_status", "status"),
        Index("ix_sc_alerts_created_at", "created_at"),
        Index("ix_sc_alerts_open_type_property", "status", "alert_type", "property_id"),
    )
