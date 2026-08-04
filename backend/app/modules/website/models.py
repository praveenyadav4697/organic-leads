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
    plugin_logs: Mapped[list["PluginLog"]] = relationship("PluginLog", back_populates="website", cascade="all, delete-orphan")
    theme_scan_logs: Mapped[list["ThemeScanLog"]] = relationship("ThemeScanLog", back_populates="website", cascade="all, delete-orphan")
    whois_records: Mapped[list["WhoisInformation"]] = relationship("WhoisInformation", cascade="all, delete-orphan")
    robots_records: Mapped[list["RobotsInformation"]] = relationship("RobotsInformation", cascade="all, delete-orphan")
    sitemap_records: Mapped[list["SitemapInformation"]] = relationship("SitemapInformation", cascade="all, delete-orphan")
    performance_records: Mapped[list["PerformanceInformation"]] = relationship("PerformanceInformation", cascade="all, delete-orphan")
    mobile_records: Mapped[list["MobileInformation"]] = relationship("MobileInformation", cascade="all, delete-orphan")
    seo_records: Mapped[list["SEOInformation"]] = relationship("SEOInformation", cascade="all, delete-orphan")
    tracking_scripts: Mapped[list["TrackingScript"]] = relationship("TrackingScript", back_populates="website", cascade="all, delete-orphan")
    consent_configs: Mapped[list["ConsentConfiguration"]] = relationship("ConsentConfiguration", back_populates="website", cascade="all, delete-orphan")
    form_validations: Mapped[list["FormValidation"]] = relationship("FormValidation", back_populates="website", cascade="all, delete-orphan")
    submission_destinations: Mapped[list["SubmissionDestination"]] = relationship("SubmissionDestination", back_populates="website", cascade="all, delete-orphan")
    event_tests: Mapped[list["EventTest"]] = relationship("EventTest", back_populates="website", cascade="all, delete-orphan")
    audit_logs: Mapped[list["TrackingAuditLog"]] = relationship("TrackingAuditLog", back_populates="website", cascade="all, delete-orphan")
    measurement_plans: Mapped[list["MeasurementPlan"]] = relationship("MeasurementPlan", back_populates="website", cascade="all, delete-orphan")
    form_submissions: Mapped[list["FormSubmission"]] = relationship("FormSubmission", back_populates="website", cascade="all, delete-orphan")

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


class PluginSecurityStatusEnum(str, enum.Enum):
    ok = "ok"
    warning = "warning"
    critical = "critical"
    unknown = "unknown"


class PluginOperationEnum(str, enum.Enum):
    install = "install"
    activate = "activate"
    deactivate = "deactivate"
    delete = "delete"
    update = "update"
    rollback = "rollback"
    auto_update_enable = "auto_update_enable"
    auto_update_disable = "auto_update_disable"
    list = "list"
    get_detail = "get_detail"
    search = "search"
    health = "health"
    security = "security"


class PluginLog(Base):
    __tablename__ = "plugin_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    plugin_slug: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    plugin_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    operation: Mapped[PluginOperationEnum] = mapped_column(Enum(PluginOperationEnum), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_by: Mapped[str | None] = mapped_column(String(100), default="system")
    execution_time_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="plugin_logs")

    __table_args__ = (
        Index("ix_plugin_logs_website_created", "website_id", "created_at"),
        Index("ix_plugin_logs_slug", "plugin_slug"),
    )


class FormStatusEnum(str, enum.Enum):
    published = "published"
    draft = "draft"
    archived = "archived"


class FormHealthEnum(str, enum.Enum):
    healthy = "healthy"
    warning = "warning"
    critical = "critical"
    unknown = "unknown"


class FormOperationEnum(str, enum.Enum):
    list = "list"
    get_detail = "get_detail"
    create = "create"
    update = "update"
    delete = "delete"
    publish = "publish"
    unpublish = "unpublish"
    duplicate = "duplicate"
    preview = "preview"
    health = "health"


class WebsiteForm(Base):
    __tablename__ = "website_forms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    wordpress_form_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    plugin: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[FormStatusEnum] = mapped_column(Enum(FormStatusEnum), default=FormStatusEnum.draft)
    shortcode: Mapped[str | None] = mapped_column(String(255), nullable=True)
    fields_count: Mapped[int] = mapped_column(Integer, default=0)
    entries_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    health: Mapped[FormHealthEnum] = mapped_column(Enum(FormHealthEnum), default=FormHealthEnum.unknown)
    responsive: Mapped[bool] = mapped_column(Boolean, default=False)
    auto_update_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website")

    __table_args__ = (
        Index("ix_forms_website_created", "website_id", "created_at"),
        Index("ix_forms_plugin", "plugin"),
    )


class FormField(Base):
    __tablename__ = "form_fields"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    form_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("website_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    field_type: Mapped[str] = mapped_column(String(50), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    placeholder: Mapped[str | None] = mapped_column(String(255), nullable=True)
    default_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    readonly: Mapped[bool] = mapped_column(Boolean, default=False)
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)
    validation: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    help_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    width: Mapped[str | None] = mapped_column(String(50), nullable=True)
    css_class: Mapped[str | None] = mapped_column(String(255), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    config: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    form: Mapped["WebsiteForm"] = relationship("WebsiteForm", backref="form_fields")


class FormHealth(Base):
    __tablename__ = "form_health"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    form_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("website_forms.id", ondelete="CASCADE"), nullable=False, index=True)
    plugin_installed: Mapped[bool] = mapped_column(Boolean, default=False)
    plugin_active: Mapped[bool] = mapped_column(Boolean, default=False)
    shortcode_valid: Mapped[bool] = mapped_column(Boolean, default=False)
    has_required_fields: Mapped[bool] = mapped_column(Boolean, default=False)
    has_submit_button: Mapped[bool] = mapped_column(Boolean, default=False)
    no_broken_fields: Mapped[bool] = mapped_column(Boolean, default=False)
    no_missing_assets: Mapped[bool] = mapped_column(Boolean, default=False)
    no_js_errors: Mapped[bool] = mapped_column(Boolean, default=False)
    no_css_errors: Mapped[bool] = mapped_column(Boolean, default=False)
    overall_status: Mapped[FormHealthEnum] = mapped_column(Enum(FormHealthEnum), default=FormHealthEnum.unknown)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website")
    form: Mapped["WebsiteForm"] = relationship("WebsiteForm")


class FormLog(Base):
    __tablename__ = "form_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    form_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    form_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    operation: Mapped[FormOperationEnum] = mapped_column(Enum(FormOperationEnum), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    result: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_by: Mapped[str | None] = mapped_column(String(100), default="system")
    execution_time_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", backref="form_logs")

    __table_args__ = (
        Index("ix_form_logs_website_created", "website_id", "created_at"),
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
    is_expired: Mapped[bool] = mapped_column(Boolean, default=False)
    is_self_signed: Mapped[bool] = mapped_column(Boolean, default=False)
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
    https_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mixed_content_count: Mapped[int] = mapped_column(Integer, default=0)
    directory_listing_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    cookies_total: Mapped[int] = mapped_column(Integer, default=0)
    cookies_secure: Mapped[int] = mapped_column(Integer, default=0)
    cookies_httponly: Mapped[int] = mapped_column(Integer, default=0)
    cookies_samesite: Mapped[int] = mapped_column(Integer, default=0)
    security_header_coverage_pct: Mapped[int] = mapped_column(Integer, default=0)
    vulnerability_count: Mapped[int] = mapped_column(Integer, default=0)
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
    forms: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
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

    lcp_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    cls: Mapped[float | None] = mapped_column(Float, nullable=True)
    inp_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    fid_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    fcp_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed_index_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    dns_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    tcp_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    tls_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    request_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    response_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    dom_processing_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    load_event_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    page_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    page_encoded_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    page_decoded_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    request_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dom_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    js_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    css_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    font_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    video_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    xhr_fetch_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    other_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    third_party_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    third_party_requests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    js_requests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    css_requests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_requests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    font_requests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    video_requests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    xhr_fetch_requests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    other_requests: Mapped[int | None] = mapped_column(Integer, nullable=True)
    largest_resource: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

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
