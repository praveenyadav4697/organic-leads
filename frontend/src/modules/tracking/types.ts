export type TrackingStatus = "active" | "inactive" | "error" | "pending";
export type VerificationStatus = "pending" | "verified" | "failed" | "warning";
export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";
export type EventType = "page_view" | "session_start" | "cta_click" | "button_click" | "form_start" | "form_submit" | "phone_click" | "email_click" | "whatsapp_click" | "purchase" | "download" | "custom";
export type ConsentStatus = "accepted" | "rejected" | "customized";
export type ConsentCategory = "necessary" | "analytics" | "marketing" | "functional";
export type FormFieldType = "text" | "email" | "phone" | "number" | "textarea" | "select" | "checkbox" | "radio" | "file" | "hidden" | "date" | "url";
export type FormStatus = "active" | "draft" | "paused";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "failed" | "retrying";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";
export type TrackingProvider = "google_analytics_4" | "google_tag_manager" | "meta_pixel" | "google_ads" | "linkedin_insight" | "microsoft_clarity" | "custom_javascript";

export interface TrackingConfig {
  id: string;
  name: string;
  websiteId: string | null;
  measurementPlanId: string | null;
  status: TrackingStatus;
  configData: Record<string, unknown>;
  version: number;
  lastValidConfig: Record<string, unknown> | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingIntegration {
  id: string;
  trackingConfigId: string;
  provider: TrackingProvider;
  trackingId: string;
  status: TrackingStatus;
  verificationStatus: VerificationStatus;
  healthStatus: HealthStatus;
  lastChecked: string | null;
  responseTimeMs: number | null;
  verificationDetails: Record<string, unknown> | null;
  settings: Record<string, unknown>;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  trackingConfigId: string;
  eventType: EventType;
  name: string;
  description: string | null;
  parameters: Record<string, unknown>;
  triggers: Record<string, unknown>;
  routingDestination: string | null;
  status: TrackingStatus;
  verificationStatus: VerificationStatus;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingVerification {
  id: string;
  trackingConfigId: string;
  integrationId: string | null;
  verificationType: string;
  status: VerificationStatus;
  details: Record<string, unknown> | null;
  errorMessage: string | null;
  correlationId: string;
  createdBy: string;
  createdAt: string;
}

export interface MeasurementPlan {
  id: string;
  name: string;
  description: string | null;
  websiteId: string | null;
  status: TrackingStatus;
  approvalStatus: ApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  objectives: Record<string, unknown>[];
  channels: Record<string, unknown>[];
  frequency: string | null;
  owner: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactForm {
  id: string;
  trackingConfigId: string;
  name: string;
  description: string | null;
  status: FormStatus;
  formType: string;
  fieldsConfig: Record<string, unknown>[];
  validationRules: Record<string, unknown>;
  spamProtection: Record<string, unknown>;
  consentRequired: boolean;
  routingRules: Record<string, unknown>;
  submissionCount: number;
  conversionRate: number;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  contactFormId: string;
  fieldName: string;
  fieldType: FormFieldType;
  label: string;
  placeholder: string | null;
  required: boolean;
  validationRules: Record<string, unknown>;
  options: string[] | null;
  conditionalLogic: Record<string, unknown> | null;
  step: number | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmission {
  id: string;
  contactFormId: string;
  trackingConfigId: string;
  rawData: Record<string, unknown>;
  normalizedData: Record<string, unknown>;
  utmData: Record<string, unknown> | null;
  landingPage: string | null;
  referrer: string | null;
  firstPage: string | null;
  exitPage: string | null;
  device: string | null;
  browser: string | null;
  ip: string | null;
  consentGiven: boolean;
  consentId: string | null;
  status: DeliveryStatus;
  deliveryResult: Record<string, unknown> | null;
  spamScore: number | null;
  spamReasons: string[] | null;
  correlationId: string;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAttachment {
  id: string;
  submissionId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string | null;
  createdAt: string;
}

export interface UTMRecord {
  id: string;
  submissionId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  fbclid: string | null;
  landingPage: string | null;
  referrer: string | null;
  createdAt: string;
}

export interface ConsentVersion {
  id: string;
  trackingConfigId: string;
  version: number;
  wording: string;
  categories: Record<string, unknown>[];
  status: TrackingStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface ConsentLog {
  id: string;
  trackingConfigId: string;
  consentVersionId: string | null;
  userId: string | null;
  sessionId: string | null;
  action: ConsentStatus;
  categories: Record<string, unknown>;
  ipAddress: string | null;
  country: string | null;
  browser: string | null;
  language: string | null;
  source: string | null;
  correlationId: string;
  createdAt: string;
}

export interface DeliveryLog {
  id: string;
  submissionId: string;
  destinationType: string;
  destinationUrl: string | null;
  status: DeliveryStatus;
  responseBody: string | null;
  responseCode: number | null;
  errorMessage: string | null;
  correlationId: string;
  retryCount: number;
  createdAt: string;
}

export interface RetryLog {
  id: string;
  deliveryLogId: string;
  submissionId: string;
  attemptNumber: number;
  status: DeliveryStatus;
  backoffSeconds: number;
  errorMessage: string | null;
  correlationId: string;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  trackingConfigId: string;
  entityType: string;
  entityId: string;
  action: string;
  title: string;
  description: string | null;
  requestedData: Record<string, unknown>;
  status: ApprovalStatus;
  requestedBy: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingDashboardStats {
  trackingHealth: number;
  verificationStatus: VerificationStatus;
  submissionCount: number;
  conversionRate: number;
  spamDetection: number;
  consentRate: number;
  failedDeliveries: number;
  retryCount: number;
  pendingApprovals: number;
  eventSummary: Record<string, number>;
}