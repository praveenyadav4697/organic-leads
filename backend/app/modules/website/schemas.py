from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, computed_field
import enum
from enum import Enum
import uuid


class EnvironmentEnum(str, Enum):
    production = "production"
    staging = "staging"
    development = "development"


class WebsiteStatusEnum(str, Enum):
    online = "online"
    degraded = "degraded"
    offline = "offline"


class ScanStatusEnum(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ThemeStatusEnum(str, Enum):
    active = "active"
    inactive = "inactive"


class PluginStatusEnum(str, Enum):
    enabled = "enabled"
    disabled = "disabled"


class HealthGradeEnum(str, Enum):
    excellent = "excellent"
    good = "good"
    fair = "fair"
    poor = "poor"
    critical = "critical"


class WebsiteBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    url: str
    domain: str
    protocol: str = "https"
    environment: EnvironmentEnum = EnvironmentEnum.production
    status: WebsiteStatusEnum = WebsiteStatusEnum.online


class WebsiteCreate(WebsiteBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    hosting_username: Optional[str] = Field(None, alias="hostingUsername")
    hosting_password: Optional[str] = Field(None, alias="hostingPassword")
    wp_admin_url: Optional[str] = Field(None, alias="wpAdminUrl")
    wp_username: Optional[str] = Field(None, alias="wpUsername")
    wp_app_password: Optional[str] = Field(None, alias="wpAppPassword")
    wp_rest_api_status: Optional[str] = Field(None, alias="wpRestApiStatus")
    wp_xmlrpc_status: Optional[str] = Field(None, alias="wpXmlrpcStatus")


class WebsiteUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    name: Optional[str] = None
    url: Optional[str] = None
    domain: Optional[str] = None
    protocol: Optional[str] = None
    environment: Optional[EnvironmentEnum] = None
    status: Optional[WebsiteStatusEnum] = None
    health: Optional[int] = None
    performance: Optional[int] = None
    seo: Optional[int] = None
    security: Optional[int] = None
    responsive: Optional[int] = None
    cms: Optional[str] = None
    hosting: Optional[str] = None
    version: Optional[str] = None
    ssl: Optional[str] = None
    registrar: Optional[str] = None
    dns: Optional[str] = None
    ip: Optional[str] = None
    location: Optional[str] = None
    whois: Optional[str] = None
    storage: Optional[int] = None
    cpu: Optional[int] = None
    memory: Optional[int] = None
    uptime: Optional[str] = None
    disk_usage: Optional[int] = None
    issues: Optional[int] = None
    updated: Optional[str] = None
    hosting_username: Optional[str] = Field(None, alias="hostingUsername")
    hosting_password: Optional[str] = Field(None, alias="hostingPassword")
    wp_admin_url: Optional[str] = Field(None, alias="wpAdminUrl")
    wp_username: Optional[str] = Field(None, alias="wpUsername")
    wp_app_password: Optional[str] = Field(None, alias="wpAppPassword")
    wp_rest_api_status: Optional[str] = Field(None, alias="wpRestApiStatus")
    wp_xmlrpc_status: Optional[str] = Field(None, alias="wpXmlrpcStatus")


class WebsiteResponse(WebsiteBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: uuid.UUID
    health: int
    performance: int
    seo: int
    security: int
    responsive: int
    last_scan: Optional[datetime] = Field(None, alias="lastScan")
    next_scan: Optional[datetime] = Field(None, alias="nextScan")
    cms: Optional[str] = None
    hosting: Optional[str] = None
    version: Optional[str] = None
    ssl: Optional[str] = None
    registrar: Optional[str] = None
    dns: Optional[str] = None
    ip: Optional[str] = None
    location: Optional[str] = None
    whois: Optional[str] = None
    storage: int
    cpu: int
    memory: int
    uptime: Optional[str] = None
    disk_usage: int = Field(0, alias="diskUsage")
    issues: int
    updated: Optional[str] = None
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    hosting_username: Optional[str] = Field(None, alias="hostingUsername")
    wp_admin_url: Optional[str] = Field(None, alias="wpAdminUrl")
    wp_username: Optional[str] = Field(None, alias="wpUsername")
    # Internal: read from ORM for credential_status; never serialized.
    wp_app_password: Optional[str] = Field(default=None, exclude=True)

    @computed_field(alias="credentialStatus")  # type: ignore[misc]
    @property
    def credential_status(self) -> str:
        """Status of stored WordPress credentials.

        Values:
            - ``configured`` — both username and encrypted application password
              are persisted in the database.
            - ``missing`` — at least one of the two required fields is empty.

        The decrypted password itself is never exposed; only its presence is.
        """
        username = getattr(self, "wp_username", None)
        password = getattr(self, "wp_app_password", None)
        if username and password:
            return "configured"
        return "missing"


class WebsiteScanHistoryBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    scan_type: str
    status: ScanStatusEnum


class WebsiteScanHistoryCreate(WebsiteScanHistoryBase):
    pass


class WebsiteScanHistoryResponse(WebsiteScanHistoryBase):
    id: uuid.UUID
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    error_message: Optional[str] = None
    stack_trace: Optional[str] = None
    retry_count: int
    result: Optional[Dict[str, Any]] = None
    created_at: datetime


class WordPressPluginBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    name: str
    version: str
    status: PluginStatusEnum = PluginStatusEnum.disabled


class WordPressPluginCreate(WordPressPluginBase):
    pass


class WordPressPluginResponse(WordPressPluginBase):
    id: uuid.UUID
    auto_update: bool
    license: Optional[str] = None
    last_updated: Optional[str] = None
    description: Optional[str] = None
    dependencies: Optional[List[str]] = None
    health: str
    created_at: datetime
    updated_at: datetime


class WordPressThemeBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    name: str
    version: str
    status: ThemeStatusEnum = ThemeStatusEnum.inactive


class WordPressThemeCreate(WordPressThemeBase):
    pass


class WordPressThemeResponse(WordPressThemeBase):
    id: uuid.UUID
    author: Optional[str] = None
    license: Optional[str] = None
    updated: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class WebsiteSSLBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    https_enabled: bool
    valid: bool


class WebsiteSSLResponse(WebsiteSSLBase):
    id: uuid.UUID
    scan_history_id: Optional[uuid.UUID] = None
    issuer: Optional[str] = None
    subject: Optional[str] = None
    tls_version: Optional[str] = None
    expires_at: Optional[datetime] = None
    days_until_expiry: Optional[int] = None
    hsts_enabled: bool
    mixed_content_count: int
    security_rating: str
    certificate_chain: Optional[List[Any]] = None
    error_message: Optional[str] = None
    checked_at: datetime


class HostingInformationBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID


class HostingInformationResponse(HostingInformationBase):
    id: uuid.UUID
    scan_history_id: Optional[uuid.UUID] = None
    hosting_provider: Optional[str] = None
    cloud_provider: Optional[str] = None
    server_software: Optional[str] = None
    operating_system: Optional[str] = None
    php_version: Optional[str] = None
    database_version: Optional[str] = None
    memory_limit: Optional[str] = None
    upload_limit: Optional[str] = None
    execution_time: Optional[str] = None
    cpu: Optional[str] = None
    disk_usage: Optional[str] = None
    storage: Optional[str] = None
    region: Optional[str] = None
    timezone: Optional[str] = None
    server_health: str
    response_headers: Optional[Dict[str, Any]] = None
    checked_at: datetime


class WebsiteHealthBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    audit_type: str


class WebsiteHealthResponse(WebsiteHealthBase):
    id: uuid.UUID
    overall_score: Optional[float] = None
    performance_score: Optional[float] = None
    accessibility_score: Optional[float] = None
    seo_score: Optional[float] = None
    security_score: Optional[float] = None
    best_practices_score: Optional[float] = None
    grade: Optional[HealthGradeEnum] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime


class WebsiteDNSBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID


class WebsiteDNSResponse(WebsiteDNSBase):
    id: uuid.UUID
    scan_history_id: Optional[uuid.UUID] = None
    nameservers: Optional[List[str]] = None
    a_records: Optional[List[str]] = None
    aaaa_records: Optional[List[str]] = None
    mx_records: Optional[List[str]] = None
    txt_records: Optional[List[str]] = None
    spf_record: Optional[str] = None
    dmarc_record: Optional[str] = None
    dnssec_enabled: bool
    propagation_status: str
    checked_at: datetime


class WebsiteSecurityBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID


class WebsiteSecurityResponse(WebsiteSecurityBase):
    id: uuid.UUID
    scan_history_id: Optional[uuid.UUID] = None
    security_headers: Optional[Dict[str, Any]] = None
    xss_protection: bool
    content_security_policy: Optional[str] = None
    hsts_enabled: bool
    hsts_max_age: Optional[int] = None
    x_frame_options: Optional[str] = None
    x_content_type_options: Optional[str] = None
    referrer_policy: Optional[str] = None
    permissions_policy: Optional[str] = None
    vulnerability_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    security_score: Optional[float] = None
    last_scanned_at: Optional[datetime] = None


class WebsiteScreenshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    website_id: uuid.UUID
    file_path: str
    width: int
    height: int
    file_size: int
    status: str
    error_message: Optional[str] = None
    captured_at: datetime


class PluginScanStatusEnum(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class PluginScanLogBase(BaseModel):
    website_id: uuid.UUID
    scan_history_id: Optional[uuid.UUID] = None
    status: PluginScanStatusEnum = PluginScanStatusEnum.queued
    total_plugins: int = 0
    active_plugins: int = 0
    inactive_plugins: int = 0
    deprecated_plugins: int = 0
    plugins_with_updates: int = 0
    plugins_with_vulnerabilities: int = 0
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None


class PluginScanLogCreate(PluginScanLogBase):
    pass


class PluginScanLogResponse(PluginScanLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class ThemeScanStatusEnum(str, enum.Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class ThemeScanLogBase(BaseModel):
    website_id: uuid.UUID
    scan_history_id: Optional[uuid.UUID] = None
    status: ThemeScanStatusEnum = ThemeScanStatusEnum.queued
    total_themes: int = 0
    active_themes: int = 0
    inactive_themes: int = 0
    deprecated_themes: int = 0
    themes_with_security_issues: int = 0
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None


class ThemeScanLogCreate(ThemeScanLogBase):
    pass


class ThemeScanLogResponse(ThemeScanLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
