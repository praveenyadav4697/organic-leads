from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
import enum
import uuid


class TrackingProviderEnum(str, enum.Enum):
    google_analytics_4 = "google_analytics_4"
    google_tag_manager = "google_tag_manager"
    meta_pixel = "meta_pixel"
    google_ads = "google_ads"
    linkedin_insight = "linkedin_insight"
    microsoft_clarity = "microsoft_clarity"
    custom_javascript = "custom_javascript"
    google_search_console = "google_search_console"
    google_site_kit = "google_site_kit"
    monsterinsights = "monsterinsights"
    pixelyoursite = "pixelyoursite"
    wpcode = "wpcode"
    header_footer_code_manager = "header_footer_code_manager"
    manual_scripts = "manual_scripts"


class TrackingStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    error = "error"
    pending = "pending"


class VerificationStatusEnum(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    failed = "failed"
    warning = "warning"


class HealthStatusEnum(str, enum.Enum):
    healthy = "healthy"
    degraded = "degraded"
    unhealthy = "unhealthy"
    unknown = "unknown"


class ConsentStatusEnum(str, enum.Enum):
    accepted = "accepted"
    rejected = "rejected"
    customized = "customized"


class DeliveryStatusEnum(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    delivered = "delivered"
    failed = "failed"
    retrying = "retrying"


class EventTypeEnum(str, enum.Enum):
    page_view = "page_view"
    session_start = "session_start"
    cta_click = "cta_click"
    button_click = "button_click"
    form_start = "form_start"
    form_submit = "form_submit"
    phone_click = "phone_click"
    email_click = "email_click"
    whatsapp_click = "whatsapp_click"
    purchase = "purchase"
    download = "download"
    custom = "custom"


class TrackingScriptBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    provider: TrackingProviderEnum
    tracking_id: str
    status: TrackingStatusEnum = TrackingStatusEnum.pending
    verification_status: VerificationStatusEnum = VerificationStatusEnum.pending
    health_status: HealthStatusEnum = HealthStatusEnum.unknown
    installation_method: Optional[str] = None
    detected_version: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None


class TrackingScriptCreate(TrackingScriptBase):
    pass


class TrackingScriptResponse(TrackingScriptBase):
    id: uuid.UUID
    last_verified: Optional[datetime] = None
    response_time_ms: Optional[int] = None
    verification_details: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TrackingScriptListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[TrackingScriptResponse]
    total: int


class TrackingScriptVerifyRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    force: bool = False


class TrackingScriptVerifyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    script_id: uuid.UUID
    status: str
    verification_status: str
    health_status: str
    response_time_ms: Optional[int] = None
    verification_details: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class ScanRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    force: bool = False


class ScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    status: str
    tracking_scripts: List[TrackingScriptResponse] = []
    forms_discovered: int = 0
    consent_config: Optional[Dict[str, Any]] = None
    validation_summary: Optional[Dict[str, Any]] = None
    routing_summary: Optional[Dict[str, Any]] = None
    tracking_verification: Optional[Dict[str, Any]] = None
    spam_protection: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class DashboardStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    tracking_providers: int = 0
    connected_providers: int = 0
    total_forms: int = 0
    healthy_forms: int = 0
    total_submissions: int = 0
    successful_events: int = 0
    failed_events: int = 0
    consent_enabled: bool = False
    total_tracking_scripts: int = 0
    active_scripts: int = 0
    verified_scripts: int = 0
    healthy_scripts: int = 0
    valid_forms: int = 0
    consent_configured: bool = False
    consent_verified: bool = False
    total_destinations: int = 0
    reachable_destinations: int = 0
    total_event_tests: int = 0
    successful_tests: int = 0
    audit_log_count: int = 0
    last_scan_at: Optional[datetime] = None
    overall_health: HealthStatusEnum = HealthStatusEnum.unknown


class SpamProtectionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recaptcha_enabled: bool = False
    recaptcha_type: Optional[str] = None
    hcaptcha_enabled: bool = False
    honeypot_enabled: bool = False
    akismet_enabled: bool = False
    spam_score: Optional[str] = None


class TrackingProviderInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    provider: str
    label: str
    connected: bool


class TrackingScriptDiscovery(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    provider: str
    provider_label: str
    tracking_id: str
    status: str
    verification_status: str
    health_status: str
    installation_method: Optional[str] = None
    detected_version: Optional[str] = None
    last_verified: Optional[datetime] = None
    settings: Optional[Dict[str, Any]] = None
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None
    last_checked: Optional[datetime] = None


class TrackingScriptsDiscoveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    scripts: List[TrackingScriptDiscovery]
    total: int
    connected_providers: List[TrackingProviderInfo]
    installed_tracking_plugins: List[Dict[str, Any]]
    synced_at: Optional[datetime] = None


class TrackingVerificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    provider: str
    provider_label: str
    tracking_id: str
    verification_status: str
    errors: List[str]
    warnings: List[str]
    last_checked: Optional[datetime] = None


class TrackingVerificationListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    providers: List[TrackingVerificationResponse]
    scripts: List[TrackingScriptDiscovery]
    synced_at: Optional[datetime] = None


class FormsDiscoveryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[Dict[str, Any]]
    total: int


class SpamProtectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    spam_protection: Dict[str, SpamProtectionInfo]
    spam_plugins: List[Dict[str, Any]]
    all_form_plugins: List[Dict[str, Any]]
    synced_at: Optional[datetime] = None


class MeasurementPlanStatusEnum(str, enum.Enum):
    draft = "draft"
    active = "active"
    completed = "completed"
    archived = "archived"


class MeasurementPlanBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    description: Optional[str] = None
    status: MeasurementPlanStatusEnum = MeasurementPlanStatusEnum.draft
    business_goals: Optional[Dict[str, Any]] = None
    target_events: Optional[Dict[str, Any]] = None
    kpi_definitions: Optional[Dict[str, Any]] = None
    tracking_providers: Optional[List[str]] = None
    kpi_targets: Optional[Dict[str, Any]] = None


class MeasurementPlanCreate(MeasurementPlanBase):
    pass


class MeasurementPlanUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[MeasurementPlanStatusEnum] = None
    business_goals: Optional[Dict[str, Any]] = None
    target_events: Optional[Dict[str, Any]] = None
    kpi_definitions: Optional[Dict[str, Any]] = None
    tracking_providers: Optional[List[str]] = None
    kpi_targets: Optional[Dict[str, Any]] = None


class MeasurementPlanResponse(MeasurementPlanBase):
    id: uuid.UUID
    website_id: uuid.UUID
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class MeasurementPlanListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[MeasurementPlanResponse]
    total: int


class FormSubmissionStatusEnum(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    delivered = "delivered"
    failed = "failed"
    spamming = "spamming"


class FormSubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    website_id: uuid.UUID
    form_id: str
    form_name: str
    plugin: str
    visitor_ip: Optional[str] = None
    submission_data: Optional[Dict[str, Any]] = None
    destination_type: Optional[str] = None
    destination_address: Optional[str] = None
    status: FormSubmissionStatusEnum
    delivery_status: Optional[str] = None
    error_message: Optional[str] = None
    submitted_at: datetime
    created_at: datetime


class FormSubmissionListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[FormSubmissionResponse]
    total: int


class FormValidationBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    form_id: str
    form_name: str
    plugin: str
    validation_rules: Optional[Dict[str, Any]] = None


class FormValidationCreate(FormValidationBase):
    pass


class FormValidationResponse(FormValidationBase):
    id: uuid.UUID
    required_fields_present: bool = False
    email_validation: bool = False
    phone_validation: bool = False
    empty_fields_check: bool = False
    spam_protection: bool = False
    captcha_enabled: bool = False
    recaptcha_enabled: bool = False
    hcaptcha_enabled: bool = False
    honeypot_enabled: bool = False
    duplicate_protection: bool = False
    file_upload_validation: bool = False
    required_checkbox: bool = False
    health_status: HealthStatusEnum = HealthStatusEnum.unknown
    validation_score: Optional[float] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class FormValidateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    force: bool = False


class FormValidationChecks(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    required_fields_present: bool = False
    email_validation: bool = False
    phone_validation: bool = False
    empty_fields_check: bool = False
    spam_protection: bool = False
    captcha_enabled: bool = False
    recaptcha_enabled: bool = False
    recaptcha_type: Optional[str] = None
    hcaptcha_enabled: bool = False
    honeypot_enabled: bool = False
    duplicate_protection: bool = False
    file_upload_validation: bool = False
    required_checkbox: bool = False


class FormValidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    form_id: str
    form_name: str
    plugin: str
    health_status: str
    validation_score: Optional[float] = None
    checks: FormValidationChecks
    error_message: Optional[str] = None


class FormTestRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    destination_type: Optional[str] = "email"
    test_data: Optional[Dict[str, Any]] = None


class FormTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    form_id: str
    destination_type: str
    status: str
    success: bool
    response_time_ms: Optional[int] = None
    event_id: Optional[str] = None
    error_message: Optional[str] = None


class ConsentConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    website_id: uuid.UUID
    cookie_banner_enabled: bool
    consent_mode: Optional[str]
    privacy_policy_url: Optional[str]
    terms_url: Optional[str]
    cookie_categories: Optional[List[str]]
    status: ConsentStatusEnum
    verification_status: VerificationStatusEnum
    last_verified: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ConsentVerifyRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    force: bool = False


class ConsentVerifyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    status: str
    verification_status: str
    cookie_banner_enabled: bool
    consent_mode: Optional[str]
    privacy_policy_url: Optional[str]
    terms_url: Optional[str]
    cookie_categories: Optional[List[str]]
    error_message: Optional[str] = None


class ConsentDetailsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    cookie_banner_enabled: bool
    consent_mode: Optional[str]
    privacy_policy_url: Optional[str]
    terms_url: Optional[str]
    cookie_categories: Optional[List[Dict[str, Any]]]
    consent_management_plugin: Optional[Dict[str, Any]]
    consent_banner_text: Optional[str]
    consent_button_text: Optional[str]
    data_retention_days: Optional[int]
    verification_status: VerificationStatusEnum
    last_verified: Optional[datetime] = None
    error_message: Optional[str] = None
    synced_at: Optional[datetime] = None


class FormSubmissionSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    form_id: str
    form_name: str
    plugin: str
    total: int
    sent: int
    failed: int


class FormSubmissionSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    submissions: List[FormSubmissionSummary]
    total_submissions: int
    total_sent: int
    total_failed: int
    synced_at: Optional[datetime] = None


class RoutingDestinationBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    form_id: str
    destination_type: str
    destination_url: Optional[str] = None
    destination_email: Optional[str] = None


class RoutingDestinationCreate(RoutingDestinationBase):
    pass


class RoutingDestinationResponse(RoutingDestinationBase):
    id: uuid.UUID
    status: TrackingStatusEnum
    verification_status: VerificationStatusEnum
    is_reachable: bool = False
    smtp_working: bool = False
    webhook_active: bool = False
    last_verified: Optional[datetime] = None
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RoutingListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[RoutingDestinationResponse]
    total: int


class DestinationVerifyRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    force: bool = False


class DestinationVerifyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    destination_id: uuid.UUID
    destination_type: str
    status: str
    is_reachable: bool
    smtp_working: bool
    webhook_active: bool
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None


class EventTestRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    event_type: EventTypeEnum
    event_name: str
    destination: Optional[str] = None
    test_data: Optional[Dict[str, Any]] = None


class EventTestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    website_id: uuid.UUID
    event_type: EventTypeEnum
    event_name: str
    status: TrackingStatusEnum
    success: bool
    response_time_ms: Optional[int] = None
    event_id: Optional[str] = None
    timestamp: Optional[datetime] = None
    destination: Optional[str] = None
    error_message: Optional[str] = None
    correlation_id: Optional[str] = None
    created_at: datetime


class EventTestListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[EventTestResponse]
    total: int


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    website_id: uuid.UUID
    operation: str
    result: str
    duration_seconds: Optional[float] = None
    correlation_id: Optional[str] = None
    error_message: Optional[str] = None
    warning_message: Optional[str] = None
    executed_by: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class AuditLogSearchRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    operation: Optional[str] = None
    result: Optional[str] = None
    correlation_id: Optional[str] = None
    executed_by: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = 1
    page_size: int = 50


class AuditLogListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ValidationReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    website_id: uuid.UUID
    total_forms: int
    valid_forms: int
    invalid_forms: int
    overall_score: float = 0.0
    forms: List[FormValidationResponse]
    generated_at: datetime


class TrackingAuditLogEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    website_id: uuid.UUID
    operation: str
    result: str
    duration_seconds: Optional[float] = None
    correlation_id: Optional[str] = None
    error_message: Optional[str] = None
    warning_message: Optional[str] = None
    executed_by: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime


class TrackingAuditLogListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[TrackingAuditLogEntry]
    total: int
    page: int
    page_size: int
    total_pages: int