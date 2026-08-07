import enum
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
import uuid


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


class SearchConsolePropertyBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    property_id: str
    property_name: str
    property_type: PropertyTypeEnum
    site_url: str
    permission_level: PermissionLevelEnum
    site_ownership: SiteOwnershipEnum
    verification_method: Optional[VerificationMethodEnum] = None
    connection_status: ConnectionStatusEnum
    created_by: str


class SearchConsolePropertyCreate(SearchConsolePropertyBase):
    pass


class SearchConsolePropertyUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    property_name: Optional[str] = None
    verification_method: Optional[VerificationMethodEnum] = None
    connection_status: Optional[ConnectionStatusEnum] = None
    is_verified: Optional[bool] = None
    verified_at: Optional[datetime] = None
    updated_by: Optional[str] = None


class SearchConsolePropertyResponse(SearchConsolePropertyBase):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: uuid.UUID
    is_verified: bool
    verified_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    sync_status: str
    sync_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class UrlInspectionRequest(BaseModel):
    inspected_url: str


class UrlInspectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: str
    inspected_url: str
    coverage_status: str
    last_crawl_time: Optional[datetime] = None
    crawl_error_code: Optional[int] = None
    canonical_url: Optional[str] = None
    page_is_indexable: Optional[bool] = None
    has_json_ld: Optional[bool] = None
    has_microdata: Optional[bool] = None
    is_roboted: Optional[bool] = None
    is_noindex: Optional[bool] = None
    is_unreachable: Optional[bool] = None
    inspection_result: Optional[Dict[str, Any]] = None
    inspected_at: datetime


class SitemapEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: str
    site_url: str
    type: str
    is_pending_sitemap: bool
    path: Optional[str] = None
    is_index_notify_allowed: Optional[bool] = None
    submitted_at: Optional[datetime] = None
    last_downloaded_at: Optional[datetime] = None
    warnings_count: int
    errors_count: int


class SitemapCreate(BaseModel):
    site_url: str
    type: str = "sitemap"


class ConnectRequest(BaseModel):
    """Payload for ``POST /search-console/connect``."""

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    site_url: str
    property_id: Optional[str] = None
    property_name: Optional[str] = None
    property_type: PropertyTypeEnum = PropertyTypeEnum.website
    permission_level: PermissionLevelEnum = PermissionLevelEnum.site_owner
    site_ownership: SiteOwnershipEnum = SiteOwnershipEnum.unverified
    verification_method: Optional[VerificationMethodEnum] = None
    created_by: str = "system"


class VerifyRequest(BaseModel):
    """Payload for ``POST /search-console/verify``."""

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    property_id: str
    verification_method: VerificationMethodEnum = VerificationMethodEnum.html


class ManualAction(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: str
    action_type: str
    action_reason: Optional[str] = None
    sites_affected: Optional[List[str]] = None
    is_partial: bool
    resolution: str
    created_at: datetime
    resolved_at: Optional[datetime] = None


class CrawlError(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: str
    platform: str
    error_type: str
    error_sub_type: Optional[str] = None
    page_url: str
    referring_url: Optional[str] = None
    status_code: Optional[int] = None
    detected_at: datetime
    resolved: bool
    resolved_at: Optional[datetime] = None


class SearchEnhancement(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    property_id: str
    enhancement_type: str
    status: str
    items_count: int
    details: Optional[Dict[str, Any]] = None
    created_at: datetime


class PerformanceRow(BaseModel):
    clicks: int
    impressions: int
    ctr: float
    position: float
    country_code: Optional[str] = None
    device: Optional[str] = None
    query: Optional[str] = None
    page: Optional[str] = None


class PerformanceResponse(BaseModel):
    rows: List[PerformanceRow]
    total_rows: int
    date_range: Dict[str, str]


class SyncRequest(BaseModel):
    sync_type: str = "full"
    force: bool = False
    # Optional convenience field — accepted on the top-level /sync route so
    # callers don't need to put property_id in the query string.
    property_id: Optional[str] = None


class SyncResponse(BaseModel):
    job_id: str
    property_id: str
    sync_type: str
    status: str
    started_at: datetime
    message: str


class StatusResponse(BaseModel):
    property_id: str
    connection_status: str
    is_verified: bool
    last_sync_at: Optional[datetime] = None
    sync_status: str
    sync_error: Optional[str] = None
    credential_status: str
    token_expires_at: Optional[datetime] = None
    token_expired: bool


class OAuthCallbackResponse(BaseModel):
    property_id: str
    connection_status: str
    is_verified: bool
    message: str


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


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: uuid.UUID
    property_id: Optional[str] = None
    alert_type: str
    severity: str
    title: str
    message: str
    status: str
    occurrence_count: int
    details: Optional[Dict[str, Any]] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class AlertActionRequest(BaseModel):
    actor: str = "system"


class AlertStatsResponse(BaseModel):
    total: int
    open: int
    acknowledged: int
    resolved: int
    open_by_type: Dict[str, int]
