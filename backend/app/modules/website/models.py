import enum
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, Float, Boolean, DateTime, Enum, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid

from app.core.database import Base


class EnvironmentEnum(str, enum.Enum):
    production = "production"
    staging = "staging"
    development = "development"


class WebsiteStatusEnum(str, enum.Enum):
    online = "online"
    degraded = "degraded"
    offline = "offline"


class ScanStatusEnum(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ThemeStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"


class PluginStatusEnum(str, enum.Enum):
    enabled = "enabled"
    disabled = "disabled"


class HealthGradeEnum(str, enum.Enum):
    excellent = "excellent"
    good = "good"
    fair = "fair"
    poor = "poor"
    critical = "critical"


class Website(Base):
    __tablename__ = "websites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    domain: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    protocol: Mapped[str] = mapped_column(String(10), default="https")
    environment: Mapped[EnvironmentEnum] = mapped_column(Enum(EnvironmentEnum), default=EnvironmentEnum.production)
    status: Mapped[WebsiteStatusEnum] = mapped_column(Enum(WebsiteStatusEnum), default=WebsiteStatusEnum.online)
    health: Mapped[int] = mapped_column(Integer, default=0)
    performance: Mapped[int] = mapped_column(Integer, default=0)
    seo: Mapped[int] = mapped_column(Integer, default=0)
    security: Mapped[int] = mapped_column(Integer, default=0)
    responsive: Mapped[int] = mapped_column(Integer, default=0)
    last_scan: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_scan: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cms: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hosting: Mapped[str | None] = mapped_column(String(255), nullable=True)
    version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ssl: Mapped[str | None] = mapped_column(String(100), nullable=True)
    registrar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dns: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    whois: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hosting_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hosting_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    wp_admin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    wp_username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    wp_app_password: Mapped[str | None] = mapped_column(Text, nullable=True)
    wp_rest_api_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    wp_xmlrpc_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    storage: Mapped[int] = mapped_column(Integer, default=0)
    cpu: Mapped[int] = mapped_column(Integer, default=0)
    memory: Mapped[int] = mapped_column(Integer, default=0)
    uptime: Mapped[str | None] = mapped_column(String(50), nullable=True)
    disk_usage: Mapped[int] = mapped_column(Integer, default=0)
    issues: Mapped[int] = mapped_column(Integer, default=0)
    updated: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    scan_history: Mapped[list["WebsiteScanHistory"]] = relationship("WebsiteScanHistory", back_populates="website", cascade="all, delete-orphan")
    plugins: Mapped[list["WordPressPlugin"]] = relationship("WordPressPlugin", back_populates="website", cascade="all, delete-orphan")
    themes: Mapped[list["WordPressTheme"]] = relationship("WordPressTheme", back_populates="website", cascade="all, delete-orphan")
    ssl_records: Mapped[list["WebsiteSSL"]] = relationship("WebsiteSSL", back_populates="website", cascade="all, delete-orphan")
    hosting_records: Mapped[list["HostingInformation"]] = relationship("HostingInformation", back_populates="website", cascade="all, delete-orphan")
    health_records: Mapped[list["WebsiteHealth"]] = relationship("WebsiteHealth", back_populates="website", cascade="all, delete-orphan")
    dns_records: Mapped[list["WebsiteDNS"]] = relationship("WebsiteDNS", back_populates="website", cascade="all, delete-orphan")
    security_records: Mapped[list["WebsiteSecurity"]] = relationship("WebsiteSecurity", back_populates="website", cascade="all, delete-orphan")
    screenshots: Mapped[list["WebsiteScreenshot"]] = relationship("WebsiteScreenshot", back_populates="website", cascade="all, delete-orphan")
    wp_syncs: Mapped[list["WordPressSync"]] = relationship("WordPressSync", back_populates="website", cascade="all, delete-orphan")
    plugin_scan_logs: Mapped[list["PluginScanLog"]] = relationship("PluginScanLog", back_populates="website", cascade="all, delete-orphan")
    theme_scan_logs: Mapped[list["ThemeScanLog"]] = relationship("ThemeScanLog", back_populates="website", cascade="all, delete-orphan")
    whois_records: Mapped[list["WhoisInformation"]] = relationship("WhoisInformation", cascade="all, delete-orphan")
    robots_records: Mapped[list["RobotsInformation"]] = relationship("RobotsInformation", cascade="all, delete-orphan")
    sitemap_records: Mapped[list["SitemapInformation"]] = relationship("SitemapInformation", cascade="all, delete-orphan")
    performance_records: Mapped[list["PerformanceInformation"]] = relationship("PerformanceInformation", cascade="all, delete-orphan")
    mobile_records: Mapped[list["MobileInformation"]] = relationship("MobileInformation", cascade="all, delete-orphan")
    seo_records: Mapped[list["SEOInformation"]] = relationship("SEOInformation", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_websites_domain", "domain"),
        Index("ix_websites_environment", "environment"),
        Index("ix_websites_status", "status"),
    )


class WebsiteScanHistory(Base):
    __tablename__ = "website_scan_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_type: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[ScanStatusEnum] = mapped_column(Enum(ScanStatusEnum), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    stack_trace: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="scan_history")

    __table_args__ = (
        Index("ix_scan_history_website_id", "website_id"),
        Index("ix_scan_history_status", "status"),
        Index("ix_scan_history_started_at", "started_at"),
    )


class WordPressPlugin(Base):
    __tablename__ = "wordpress_plugins"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[PluginStatusEnum] = mapped_column(Enum(PluginStatusEnum), default=PluginStatusEnum.disabled)
    auto_update: Mapped[bool] = mapped_column(Boolean, default=False)
    license: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_updated: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    dependencies: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    health: Mapped[str] = mapped_column(String(30), nullable=False, default="unknown")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="plugins")

    __table_args__ = (
        Index("ix_plugins_website_id", "website_id"),
    )


class WordPressTheme(Base):
    __tablename__ = "wordpress_themes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[ThemeStatusEnum] = mapped_column(Enum(ThemeStatusEnum), default=ThemeStatusEnum.inactive)
    author: Mapped[str | None] = mapped_column(String(255), nullable=True)
    license: Mapped[str | None] = mapped_column(String(100), nullable=True)
    updated: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="themes")

    __table_args__ = (
        Index("ix_themes_website_id", "website_id"),
    )


class WebsiteSSL(Base):
    __tablename__ = "website_ssl"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)
    https_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)
    valid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    issuer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tls_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    days_until_expiry: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hsts_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mixed_content_count: Mapped[int] = mapped_column(Integer, default=0)
    security_rating: Mapped[str] = mapped_column(String(10), nullable=False, default="F")
    certificate_chain: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="ssl_records")

    __table_args__ = (
        Index("ix_ssl_website_checked", "website_id", "checked_at"),
    )


class HostingInformation(Base):
    __tablename__ = "hosting_information"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)
    hosting_provider: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cloud_provider: Mapped[str | None] = mapped_column(String(255), nullable=True)
    server_software: Mapped[str | None] = mapped_column(String(500), nullable=True)
    operating_system: Mapped[str | None] = mapped_column(String(255), nullable=True)
    php_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    database_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    memory_limit: Mapped[str | None] = mapped_column(String(100), nullable=True)
    upload_limit: Mapped[str | None] = mapped_column(String(100), nullable=True)
    execution_time: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cpu: Mapped[str | None] = mapped_column(String(100), nullable=True)
    disk_usage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    storage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region: Mapped[str | None] = mapped_column(String(255), nullable=True)
    timezone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    server_health: Mapped[str] = mapped_column(String(30), nullable=False, default="unknown")
    response_headers: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="hosting_records")

    __table_args__ = (
        Index("ix_hosting_website_checked", "website_id", "checked_at"),
    )


class WebsiteHealth(Base):
    __tablename__ = "website_health"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    audit_type: Mapped[str] = mapped_column(String(100), nullable=False)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    performance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    accessibility_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    seo_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    security_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    best_practices_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    grade: Mapped[HealthGradeEnum | None] = mapped_column(Enum(HealthGradeEnum), nullable=True)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="health_records")

    __table_args__ = (
        Index("ix_health_website_audit", "website_id", "audit_type"),
    )


class WebsiteDNS(Base):
    __tablename__ = "website_dns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)
    nameservers: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    a_records: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    aaaa_records: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    mx_records: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    txt_records: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    spf_record: Mapped[str | None] = mapped_column(String(500), nullable=True)
    dmarc_record: Mapped[str | None] = mapped_column(String(500), nullable=True)
    dnssec_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    propagation_status: Mapped[str] = mapped_column(String(50), nullable=False, default="unknown")
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="dns_records")

    __table_args__ = (
        Index("ix_dns_website_checked", "website_id", "checked_at"),
    )


class WebsiteSecurity(Base):
    __tablename__ = "website_security"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)
    security_headers: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    xss_protection: Mapped[bool] = mapped_column(Boolean, default=False)
    content_security_policy: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    hsts_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    hsts_max_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    x_frame_options: Mapped[str | None] = mapped_column(String(100), nullable=True)
    x_content_type_options: Mapped[str | None] = mapped_column(String(100), nullable=True)
    referrer_policy: Mapped[str | None] = mapped_column(String(100), nullable=True)
    permissions_policy: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    vulnerability_count: Mapped[int] = mapped_column(Integer, default=0)
    critical_count: Mapped[int] = mapped_column(Integer, default=0)
    high_count: Mapped[int] = mapped_column(Integer, default=0)
    medium_count: Mapped[int] = mapped_column(Integer, default=0)
    low_count: Mapped[int] = mapped_column(Integer, default=0)
    security_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_scanned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    website: Mapped["Website"] = relationship("Website", back_populates="security_records")

    __table_args__ = (
        Index("ix_security_website_scanned", "website_id", "last_scanned_at"),
    )


class WebsiteScreenshot(Base):
    __tablename__ = "website_screenshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    width: Mapped[int] = mapped_column(Integer, nullable=False, default=1440)
    height: Mapped[int] = mapped_column(Integer, nullable=False, default=900)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="completed")
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="screenshots")

    __table_args__ = (
        Index("ix_screenshot_website_captured", "website_id", "captured_at"),
    )


class WordPressSync(Base):
    __tablename__ = "wordpress_sync"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    sync_type: Mapped[str] = mapped_column(String(50), nullable=False, default="full")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="completed")
    system_info: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    plugins: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    themes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    security: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    performance: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    health: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="wp_syncs")

    __table_args__ = (
        Index("ix_wp_sync_website_synced", "website_id", "synced_at"),
    )


class PluginScanStatusEnum(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class PluginScanLog(Base):
    __tablename__ = "plugin_scan_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[PluginScanStatusEnum] = mapped_column(Enum(PluginScanStatusEnum), nullable=False, default=PluginScanStatusEnum.queued)
    total_plugins: Mapped[int] = mapped_column(Integer, default=0)
    active_plugins: Mapped[int] = mapped_column(Integer, default=0)
    inactive_plugins: Mapped[int] = mapped_column(Integer, default=0)
    deprecated_plugins: Mapped[int] = mapped_column(Integer, default=0)
    plugins_with_updates: Mapped[int] = mapped_column(Integer, default=0)
    plugins_with_vulnerabilities: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="plugin_scan_logs")

    __table_args__ = (
        Index("ix_plugin_scan_website_started", "website_id", "started_at"),
        Index("ix_plugin_scan_status", "status"),
    )


class ThemeScanStatusEnum(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ThemeScanLog(Base):
    __tablename__ = "theme_scan_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[ThemeScanStatusEnum] = mapped_column(Enum(ThemeScanStatusEnum), nullable=False, default=ThemeScanStatusEnum.queued)
    total_themes: Mapped[int] = mapped_column(Integer, default=0)
    active_themes: Mapped[int] = mapped_column(Integer, default=0)
    inactive_themes: Mapped[int] = mapped_column(Integer, default=0)
    deprecated_themes: Mapped[int] = mapped_column(Integer, default=0)
    themes_with_security_issues: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="theme_scan_logs")

    __table_args__ = (
        Index("ix_theme_scan_website_started", "website_id", "started_at"),
        Index("ix_theme_scan_status", "status"),
    )


# ---------------------------------------------------------------------------
# Discovery fact tables (public-only, populated from anonymous HTTP / DNS /
# WHOIS / RDAP probes — no WordPress credentials, no plugin auth).
# ---------------------------------------------------------------------------


class WhoisInformation(Base):
    """Domain registration facts from RDAP (preferred) or WHOIS fallback."""

    __tablename__ = "whois_information"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)

    registrar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registrant_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registrant_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registration_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    name_servers: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    status: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    dnssec_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str | None] = mapped_column(String(20), nullable=True)  # 'rdap' | 'whois' | 'unavailable'
    not_publicly_available: Mapped[bool] = mapped_column(Boolean, default=False)
    raw_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class RobotsInformation(Base):
    __tablename__ = "robots_information"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)

    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    exists: Mapped[bool] = mapped_column(Boolean, default=False)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    not_publicly_available: Mapped[bool] = mapped_column(Boolean, default=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class SitemapInformation(Base):
    __tablename__ = "sitemap_information"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)

    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    exists: Mapped[bool] = mapped_column(Boolean, default=False)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    url_count: Mapped[int] = mapped_column(Integer, default=0)
    sitemap_kind: Mapped[str | None] = mapped_column(String(50), nullable=True)  # 'sitemap.xml' | 'sitemap_index.xml' | 'wp-sitemap.xml'
    not_publicly_available: Mapped[bool] = mapped_column(Boolean, default=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class PerformanceInformation(Base):
    __tablename__ = "performance_information"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)

    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ttfb_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    redirect_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    http_version: Mapped[str | None] = mapped_column(String(20), nullable=True)
    content_encoding: Mapped[str | None] = mapped_column(String(20), nullable=True)
    compression_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    final_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    not_publicly_available: Mapped[bool] = mapped_column(Boolean, default=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class MobileInformation(Base):
    __tablename__ = "mobile_information"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)

    viewport_meta: Mapped[str | None] = mapped_column(String(500), nullable=True)
    has_responsive_tag: Mapped[bool] = mapped_column(Boolean, default=False)
    not_publicly_available: Mapped[bool] = mapped_column(Boolean, default=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class SEOInformation(Base):
    __tablename__ = "seo_information"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False)
    scan_history_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("website_scan_history.id", ondelete="SET NULL"), nullable=True)

    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    canonical_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    robots_meta: Mapped[str | None] = mapped_column(String(200), nullable=True)

    h1_count: Mapped[int] = mapped_column(Integer, default=0)
    h2_count: Mapped[int] = mapped_column(Integer, default=0)
    images_total: Mapped[int] = mapped_column(Integer, default=0)
    images_missing_alt: Mapped[int] = mapped_column(Integer, default=0)

    og_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    og_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    og_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    og_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    twitter_card: Mapped[str | None] = mapped_column(String(100), nullable=True)
    twitter_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    twitter_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    twitter_image: Mapped[str | None] = mapped_column(String(500), nullable=True)

    json_ld_blocks: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    has_schema_org: Mapped[bool] = mapped_column(Boolean, default=False)

    not_publicly_available: Mapped[bool] = mapped_column(Boolean, default=False)
    raw_head: Mapped[str | None] = mapped_column(Text, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
