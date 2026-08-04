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


class ThemeActivateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str


class ThemeUpdateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str


class ThemeDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    slug: str
    version: str
    author: Optional[str] = None
    author_uri: Optional[str] = None
    description: Optional[str] = None
    template: Optional[str] = None
    stylesheet: Optional[str] = None
    theme_root: Optional[str] = None
    theme_root_uri: Optional[str] = None
    screenshot: Optional[str] = None
    screenshot_uri: Optional[str] = None
    tags: Optional[List[str]] = None
    theme_uri: Optional[str] = None
    license: Optional[str] = None
    license_uri: Optional[str] = None
    text_domain: Optional[str] = None
    domain_path: Optional[str] = None
    requires_wp: Optional[str] = None
    requires_php: Optional[str] = None
    requires: Optional[str] = None
    tested_wp: Optional[str] = None
    tested_php: Optional[str] = None
    last_updated: Optional[str] = None
    active: bool = False
    auto_update: bool = False
    parent: Optional[str] = None


class PluginActivateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str


class PluginDeactivateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str


class PluginDeleteRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    force: bool = False
    delete_files: bool = False


class PluginUpdateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str


class PluginRollbackRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    version: str


class PluginAutoUpdateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str
    enabled: bool


class PluginSearchRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    query: str
    per_page: int = 10
    page: int = 1


class PluginInstallRepoRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    slug: str


class PluginDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    slug: str
    version: Optional[str] = None
    latest_version: Optional[str] = None
    description: Optional[str] = None
    author: Optional[str] = None
    author_profile: Optional[str] = None
    plugin_uri: Optional[str] = None
    text_domain: Optional[str] = None
    domain_path: Optional[str] = None
    requires_wp: Optional[str] = None
    requires_php: Optional[str] = None
    requires: Optional[str] = None
    tested_wp: Optional[str] = None
    tested_php: Optional[str] = None
    license: Optional[str] = None
    license_uri: Optional[str] = None
    update_available: bool = False
    auto_update: bool = False
    active: bool = False
    network_active: bool = False
    plugin_size: Optional[str] = None
    install_date: Optional[str] = None
    last_updated: Optional[str] = None
    rating: Optional[float] = None
    num_ratings: Optional[int] = None
    downloads: Optional[int] = None
    tags: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    conflicts: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    sections: Optional[Dict[str, str]] = None
    vulnerability_count: Optional[int] = None
    security_issues: Optional[List[str]] = None
    health_score: Optional[int] = None
    load_time_ms: Optional[float] = None
    memory_usage_kb: Optional[float] = None
    db_queries: Optional[int] = None
    http_requests: Optional[int] = None


class PluginOperationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    message: str
    plugin: Optional[Dict[str, Any]] = None
    slug: Optional[str] = None
    status: Optional[str] = None


class PluginSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    slug: str
    description: Optional[str] = None
    version: Optional[str] = None
    author: Optional[str] = None
    author_profile: Optional[str] = None
    plugin_uri: Optional[str] = None
    rating: Optional[float] = None
    num_ratings: Optional[int] = None
    downloaded: Optional[int] = None
    last_updated: Optional[str] = None
    requires_wp: Optional[str] = None
    requires_php: Optional[str] = None
    tested_wp: Optional[str] = None
    tags: Optional[List[str]] = None
    sections: Optional[Dict[str, str]] = None
    download_link: Optional[str] = None


class PluginLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    website_id: uuid.UUID
    plugin_slug: str
    plugin_name: Optional[str] = None
    operation: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    executed_by: Optional[str] = None
    execution_time_seconds: Optional[float] = None
    created_at: datetime


class FormFieldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    field_type: str
    label: str
    name: str
    placeholder: Optional[str] = None
    default_value: Optional[str] = None
    required: bool = False
    readonly: bool = False
    hidden: bool = False
    validation: Optional[Dict[str, Any]] = None
    help_text: Optional[str] = None
    width: Optional[str] = None
    css_class: Optional[str] = None
    position: int = 0
    config: Optional[Dict[str, Any]] = None


class FormResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    plugin: str
    name: str
    description: Optional[str] = None
    status: str
    shortcode: Optional[str] = None
    fields_count: int
    entries_count: Optional[int] = None
    health: str
    responsive: bool
    auto_update_enabled: bool
    fields: List[FormFieldResponse]
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class FormDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    plugin: str
    name: str
    description: Optional[str] = None
    status: str
    shortcode: Optional[str] = None
    fields: List[FormFieldResponse]
    fields_count: int
    entries_count: Optional[int] = None
    health: str
    responsive: bool
    health_checks: Optional[Dict[str, bool]] = None
    responsive_breakdown: Optional[Dict[str, str]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class FormHealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_forms: int
    published_forms: int
    draft_forms: int
    active_forms: int
    broken_forms: int
    forms_with_errors: int
    last_updated: Optional[str] = None
    recently_created: int


class FormCreateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    plugin: str
    name: str
    description: Optional[str] = None
    fields: List[Dict[str, Any]] = []


class FormUpdateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = None


class FormPublishRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str


class FormUnpublishRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str


class FormDuplicateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str


class FormDeleteRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str


class FormOperationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    success: bool
    message: str
    form: Optional[Dict[str, Any]] = None


class FormLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    website_id: uuid.UUID
    form_id: str
    form_name: Optional[str] = None
    operation: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    executed_by: Optional[str] = None
    execution_time_seconds: Optional[float] = None
    created_at: datetime


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



# ===========================================================================
# Connector Plugin Schemas
# ===========================================================================


class SystemInfoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    site_name: str
    site_url: str
    home_url: str
    admin_email: str
    language: str
    timezone: str
    permalink_structure: str
    multisite: bool
    https: bool
    charset: str
    version: str


class SiteHealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    wordpress: Dict[str, Any]
    directories: Dict[str, Any]
    themes: Dict[str, Any]
    plugins: Dict[str, Any]
    media: Dict[str, Any]
    server: Dict[str, Any]
    database: Dict[str, Any]
    constants: Dict[str, Any]
    filesystem: Dict[str, Any]


class ServerInfoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    os: str
    web_server: str
    php_version: str
    cpu_cores: str
    memory_limit: str
    memory_usage: str
    memory_peak: str
    disk_total: str
    disk_free: str
    disk_usage: str
    uptime: str
    upload_max_size: str
    post_max_size: str
    execution_time: str
    max_input_vars: int
    mysql_version: str
    extensions: List[Dict[str, Any]]
    server_software: str
    https: bool
    curl_version: str
    zip_enabled: bool
    gd_enabled: bool
    json_enabled: bool
    mbstring_enabled: bool
    mysqli_enabled: bool
    openssl_enabled: bool
    xml_enabled: bool
    dom_enabled: bool


class DatabaseInfoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    database_name: str
    table_prefix: str
    total_tables: int
    total_size: str
    tables: List[Dict[str, Any]]
    optimization_status: str
    collation: str
    charset: str


class FormsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    forms: List[Dict[str, Any]]


class PagesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    pages: List[Dict[str, Any]]


class PostsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    posts: Dict[str, Any]


class MediaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    images: Dict[str, Any]
    videos: Dict[str, Any]
    pdfs: Dict[str, Any]
    total_attachments: int
    media_usage: List[Dict[str, Any]]
    unused_media: List[Dict[str, Any]]


class UsersResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    users: List[Dict[str, Any]]


class MenusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    menus: List[Dict[str, Any]]


class WidgetsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    registered_widgets: List[Dict[str, Any]]
    registered_sidebars: List[Dict[str, Any]]
    active_widgets: List[Dict[str, Any]]
    total_registered: int
    total_sidebars: int
    total_active: int


class PerformanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ttfb: float
    page_size: Dict[str, Any]
    requests: Dict[str, Any]
    compression: Dict[str, Any]
    caching: Dict[str, Any]
    core_web_vitals: Dict[str, Any]
    lcp: Optional[float]
    cls: Optional[float]
    inp: Optional[float]
    server_response_time: float


class ResponsiveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    url: str
    desktop: Dict[str, Any]
    tablet: Dict[str, Any]
    mobile: Dict[str, Any]


class SecurityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    https: bool
    security_headers: Dict[str, Any]
    wp_debug: bool
    debug_display: bool
    debug_log: bool
    directory_listing: bool
    file_editing: bool
    file_modification: bool
    login_protection: bool
    ssl_force: bool
    user_enumeration: bool
    xmlrpc_enabled: bool
    rest_api_enabled: bool
    php_exposure: bool
    version_disclosure: bool


class LogsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    logs: List[Dict[str, Any]]
    total: int


class BackupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    latest_backup: Dict[str, Any]
    backup_locations: List[Dict[str, Any]]
    supported_plugins: List[Dict[str, Any]]


class ScreenshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    device: str
    width: int
    height: int
    filename: str
    url: str
    path: str


class FullSyncResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    system: Dict[str, Any]
    plugins: Dict[str, Any]
    themes: Dict[str, Any]
    forms: Dict[str, Any]
    security: Dict[str, Any]
    performance: Dict[str, Any]
    health: Dict[str, Any]
