export type TrackingProvider = "google_analytics_4" | "google_tag_manager" | "meta_pixel" | "google_ads" | "linkedin_insight" | "microsoft_clarity" | "custom_javascript" | "google_search_console" | "google_site_kit" | "monsterinsights" | "pixelyoursite" | "wpcode" | "header_footer_code_manager" | "manual_scripts";
export type TrackingStatus = "active" | "inactive" | "error" | "pending";
export type VerificationStatus = "pending" | "verified" | "failed" | "warning";
export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";
export type ConsentStatus = "accepted" | "rejected" | "customized";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed" | "retrying";
export type EventType = "page_view" | "session_start" | "cta_click" | "button_click" | "form_start" | "form_submit" | "phone_click" | "email_click" | "whatsapp_click" | "purchase" | "download" | "custom";
export type FormStatus = "active" | "draft" | "paused";

export interface TrackingScript {
  id: string;
  website_id: string;
  provider: TrackingProvider;
  tracking_id: string;
  status: TrackingStatus;
  verification_status: VerificationStatus;
  health_status: HealthStatus;
  installation_method: string | null;
  detected_version: string | null;
  last_verified: string | null;
  response_time_ms: number | null;
  verification_details: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  error_message: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsentConfiguration {
  id: string;
  website_id: string;
  cookie_banner_enabled: boolean;
  consent_mode: string | null;
  privacy_policy_url: string | null;
  terms_url: string | null;
  cookie_categories: string[] | null;
  status: ConsentStatus;
  verification_status: VerificationStatus;
  last_verified: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface CookieCategory {
  name: string;
  label: string;
  description?: string;
  enabled: boolean;
  editable: boolean;
}

export interface ConsentManagementPlugin {
  plugin: string | null;
  name: string;
  detected: boolean;
}

export interface ConsentDetails {
  website_id: string;
  cookie_banner_enabled: boolean;
  consent_mode: string | null;
  privacy_policy_url: string | null;
  terms_url: string | null;
  cookie_categories: CookieCategory[] | null;
  consent_management_plugin: ConsentManagementPlugin | null;
  consent_banner_text: string | null;
  consent_button_text: string | null;
  data_retention_days: number | null;
  verification_status: VerificationStatus;
  last_verified: string | null;
  error_message: string | null;
  synced_at: string | null;
}

export interface FormValidation {
  id: string;
  website_id: string;
  form_id: string;
  form_name: string;
  plugin: string;
  validation_rules: Record<string, unknown> | null;
  required_fields_present: boolean;
  email_validation: boolean;
  phone_validation: boolean;
  empty_fields_check: boolean;
  spam_protection: boolean;
  captcha_enabled: boolean;
  recaptcha_enabled: boolean;
  honeypot_enabled: boolean;
  duplicate_protection: boolean;
  file_upload_validation: boolean;
  required_checkbox: boolean;
  health_status: HealthStatus;
  validation_score: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmissionDestination {
  id: string;
  website_id: string;
  form_id: string;
  destination_type: string;
  destination_url: string | null;
  destination_email: string | null;
  status: TrackingStatus;
  verification_status: VerificationStatus;
  is_reachable: boolean;
  smtp_working: boolean;
  webhook_active: boolean;
  last_verified: string | null;
  response_time_ms: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventTest {
  id: string;
  website_id: string;
  event_type: EventType;
  event_name: string;
  status: TrackingStatus;
  success: boolean;
  response_time_ms: number | null;
  event_id: string | null;
  timestamp: string | null;
  destination: string | null;
  error_message: string | null;
  correlation_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackingAuditLog {
  id: string;
  website_id: string;
  operation: string;
  result: string;
  duration_seconds: number | null;
  correlation_id: string | null;
  error_message: string | null;
  warning_message: string | null;
  executed_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SpamProtectionInfo {
  recaptcha_enabled: boolean;
  recaptcha_type: string | null;
  hcaptcha_enabled: boolean;
  honeypot_enabled: boolean;
  akismet_enabled: boolean;
  spam_score: string | null;
}

export interface TrackingProviderInfo {
  provider: string;
  label: string;
  connected: boolean;
}

export interface TrackingScriptDiscovery {
  id: string;
  provider: string;
  provider_label: string;
  tracking_id: string;
  status: string;
  verification_status: string;
  health_status: string;
  installation_method: string | null;
  detected_version: string | null;
  last_verified: string | null;
  settings: Record<string, unknown> | null;
  errors: string[] | null;
  warnings: string[] | null;
  last_checked: string | null;
}

export interface VerificationProvider {
  provider: string;
  provider_label: string;
  tracking_id: string;
  verification_status: VerificationStatus;
  errors: string[];
  warnings: string[];
  last_checked: string | null;
}

export interface TrackingVerificationListResponse {
  providers: VerificationProvider[];
  scripts: TrackingScriptDiscovery[];
  synced_at: string | null;
}

export interface TrackingVerificationItem {
  provider: string;
  provider_label: string;
  tracking_id: string;
  verification_status: string;
  errors: string[];
  warnings: string[];
  last_checked: string | null;
}

export interface ConsentVerifyResponse {
  website_id: string;
  status: string;
  verification_status: string;
  cookie_banner_enabled: boolean;
  consent_mode: string | null;
  privacy_policy_url: string | null;
  terms_url: string | null;
  cookie_categories: string[] | null;
  error_message: string | null;
}

export type MeasurementPlanStatus = "draft" | "active" | "completed" | "archived";

export interface MeasurementPlan {
  id: string;
  website_id: string;
  name: string;
  description: string | null;
  status: MeasurementPlanStatus;
  business_goals: Record<string, unknown> | null;
  target_events: Record<string, unknown> | null;
  kpi_definitions: Record<string, unknown> | null;
  tracking_providers: string[] | null;
  kpi_targets: Record<string, unknown> | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type FormSubmissionStatus = "pending" | "sent" | "delivered" | "failed" | "spamming";

export interface FormSubmission {
  id: string;
  website_id: string;
  form_id: string;
  form_name: string;
  plugin: string;
  visitor_ip: string | null;
  visitor_user_agent: string | null;
  submission_data: Record<string, unknown> | null;
  destination_type: string | null;
  destination_address: string | null;
  status: FormSubmissionStatus;
  delivery_status: string | null;
  error_message: string | null;
  submitted_at: string;
  created_at: string;
}

export interface FormSubmissionSummary {
  form_id: string;
  form_name: string;
  plugin: string;
  total: number;
  sent: number;
  failed: number;
}

export interface FormSubmissionSummaryResponse {
  submissions: FormSubmissionSummary[];
  total_submissions: number;
  total_sent: number;
  total_failed: number;
  synced_at: string | null;
}

export interface DashboardStats {
  website_id: string;
  tracking_providers: number;
  connected_providers: number;
  total_forms: number;
  healthy_forms: number;
  total_submissions: number;
  successful_events: number;
  failed_events: number;
  consent_enabled: boolean;
  total_tracking_scripts: number;
  active_scripts: number;
  verified_scripts: number;
  healthy_scripts: number;
  valid_forms: number;
  consent_configured: boolean;
  consent_verified: boolean;
  total_destinations: number;
  reachable_destinations: number;
  total_event_tests: number;
  successful_tests: number;
  audit_log_count: number;
  last_scan_at: string | null;
  overall_health: HealthStatus;
}
