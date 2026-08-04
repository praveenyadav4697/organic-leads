export type RegistrationStatus = "pending" | "in_progress" | "completed" | "failed";

export interface WebsiteRegistrationCreate {
  name: string;
  url: string;
  domain: string;
  protocol: "https" | "http";
  environment?: "production" | "staging" | "development";
  hostingProvider?: string;
  hostingType?: "shared" | "cloud" | "dedicated" | "vps";
  hostingUsername?: string;
  hostingPassword?: string;
  accessProtocol?: "ftp" | "sftp" | "ssh";
  wpAdminUrl?: string;
  wpUsername?: string;
  wpAppPassword?: string;
  wpRestApiStatus?: string;
  wpXmlrpcStatus?: string;
}

export interface WebsiteRegistrationResponse {
  id: string;
  name: string;
  url: string;
  domain: string;
  protocol: string;
  environment: string;
  status: string;
  health: number;
  performance: number;
  seo: number;
  security: number;
  responsive: number;
  lastScan?: string | null;
  nextScan?: string | null;
  cms: string;
  hosting: string;
  version: string | null;
  ssl: string | null;
  registrar: string | null;
  dns: string | null;
  ip: string | null;
  location: string | null;
  whois: string | null;
  storage: number;
  cpu: number;
  memory: number;
  uptime: string | null;
  diskUsage: number;
  issues: number;
  updated: string;
  createdAt: string;
  updatedAt: string;
  registrationStatus: RegistrationStatus;
  wordpressInfoStatus: RegistrationStatus;
  hostingUsername?: string;
  wpAdminUrl?: string;
  wpUsername?: string;
  /**
   * Server-derived status of stored WordPress credentials.
   *   - "configured" — username AND encrypted app password are persisted.
   *   - "missing"    — one or both are missing in the database.
   * The decrypted password itself is never returned by the API.
   */
  credentialStatus?: "configured" | "missing";
}

export interface WebsitePerformance {
  response_time_ms: number | null;
  ttfb_ms: number | null;
  dns_ms: number | null;
  tcp_ms: number | null;
  tls_ms: number | null;
  request_ms: number | null;
  response_ms: number | null;
  dom_processing_ms: number | null;
  load_event_ms: number | null;
  redirect_count: number | null;
  http_version: string | null;
  content_encoding: string | null;
  compression_enabled: boolean;
  final_url: string | null;
  status_code: number | null;
  lcp_ms: number | null;
  cls: number | null;
  inp_ms: number | null;
  fid_ms: number | null;
  fcp_ms: number | null;
  speed_index_ms: number | null;
  page_size_bytes: number | null;
  page_encoded_bytes: number | null;
  page_decoded_bytes: number | null;
  request_count: number | null;
  dom_size: number | null;
  js_bytes: number | null;
  css_bytes: number | null;
  image_bytes: number | null;
  font_bytes: number | null;
  video_bytes: number | null;
  audio_bytes: number | null;
  xhr_fetch_bytes: number | null;
  other_bytes: number | null;
  third_party_bytes: number | null;
  third_party_requests: number | null;
  js_requests: number | null;
  css_requests: number | null;
  image_requests: number | null;
  font_requests: number | null;
  video_requests: number | null;
  audio_requests: number | null;
  xhr_fetch_requests: number | null;
  other_requests: number | null;
  largest_resource: Record<string, unknown> | null;
  slowest_resource: Record<string, unknown> | null;
  protocol: string | null;
  not_publicly_available: boolean;
}

export interface CoreVitals {
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  speedIndex: number | null;
  pageSize: number | null;
}

export interface DiagnosticPlugin {
  plugin_key: string;
  name: string;
  version: string | null;
  status: string;
  author: string | null;
  plugin_url: string | null;
  license: string | null;
  update_available: boolean;
  deprecated: boolean;
  deprecation_reason: string | null;
  vulnerabilities: string[] | null;
  health: "good" | "warn" | "critical" | "unknown";
}

export interface DiagnosticTheme {
  stylesheet: string;
  name: string;
  version: string | null;
  status: string;
  author: string | null;
  parent_theme: string | null;
  is_child_theme: boolean;
  license: string | null;
  theme_url: string | null;
  screenshot_url: string | null;
  deprecated: boolean;
  deprecation_reason: string | null;
  security_issues: string[] | null;
}

export interface DiagnosticSSL {
  https_enabled: boolean;
  valid: boolean;
  issuer: string | null;
  subject: string | null;
  tls_version: string | null;
  expires_at: string | null;
  days_until_expiry: number | null;
  hsts_enabled: boolean;
  mixed_content_count: number;
  security_rating: string;
  certificate_chain: unknown[] | null;
  error_message: string | null;
}

export interface DiagnosticDNS {
  resolvable: boolean;
  ips: string[];
  error?: string;
}

export interface DiagnosticHosting {
  hosting_provider: string | null;
  cloud_provider: string | null;
  server_software: string | null;
  operating_system: string | null;
  php_version: string | null;
  database_version: string | null;
  memory_limit: string | null;
  upload_limit: string | null;
  execution_time: string | null;
  cpu: string | null;
  disk_usage: string | null;
  storage: string | null;
  region: string | null;
  timezone: string | null;
  server_health: string;
  response_headers: Record<string, string>;
}

export interface DiagnosticHealth {
  availability: number;
  ssl: number;
  dns: number;
  hosting: number;
  performance: number;
  wordpress: number;
  themes: number;
  plugins: number;
  security: number;
  broken_links: number | null;
  redirects: number;
  robots: boolean | null;
  sitemap: boolean | null;
  response_time_ms: number | null;
  health_score: number;
  best_practices: number;
  grade: string;
  recommendations: string[];
}

export interface DiagnosticScanResult {
  ssl: DiagnosticSSL;
  dns: DiagnosticDNS;
  hosting: DiagnosticHosting;
  health: DiagnosticHealth;
  plugins_found: number;
  themes_found: number;
  mobile?: {
    viewport_meta?: string;
    has_responsive_tag?: boolean;
  };
  responsive_score?: number;
  errors?: string[];
}

export interface DiagnosticsRunResponse {
  website_id: string;
  scan_id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  result?: DiagnosticScanResult;
}

export interface PluginScanEntry {
  id: string;
  website_id: string;
  scan_history_id: string;
  plugin_key: string;
  name: string;
  version: string | null;
  status: string;
  author: string | null;
  plugin_url: string | null;
  license: string | null;
  update_available: boolean;
  deprecated: boolean;
  deprecation_reason: string | null;
  vulnerabilities: string[] | null;
  health: string;
  scanned_at: string;
}

export interface ThemeScanEntry {
  id: string;
  website_id: string;
  scan_history_id: string;
  stylesheet: string;
  name: string;
  version: string | null;
  status: string;
  author: string | null;
  parent_theme: string | null;
  is_child_theme: boolean;
  license: string | null;
  theme_url: string | null;
  screenshot_url: string | null;
  deprecated: boolean;
  deprecation_reason: string | null;
  security_issues: string[] | null;
  scanned_at: string;
}

export interface ScanHistoryEntry {
  id: string;
  website_id: string;
  scan_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  error_message: string | null;
  retry_count: number;
  result: DiagnosticScanResult | null;
}

export interface WebsiteScanRequest {
  scanType: "full" | "quick" | "custom";
  force: boolean;
}

export interface WebsiteScanResponse {
  websiteId: string;
  scanId: string;
  status: string;
  startedAt: string;
  estimatedDurationSeconds: number;
}

export interface WorkflowStepStatus {
  step: number;
  name: string;
  status: string;
  message: string;
  durationSeconds: number;
}

export interface WebsiteWorkflowRequest {
  scanType: "full" | "quick" | "custom";
  includeBackup: boolean;
  includeAudit: boolean;
  includeInventory: boolean;
}

export interface WebsiteWorkflowStatusResponse {
  websiteId: string;
  workflowId: string;
  status: string;
  progressPercent: number;
  totalSteps: number;
  completedSteps: number;
  currentStep: number | null;
  steps: WorkflowStepStatus[];
  startedAt: string | null;
  completedAt: string | null;
  result: Record<string, unknown> | null;
}

export interface WebsiteQuickStats {
  plugins: { n: string; v: string; s: string }[];
  backups: { date: string; size: string }[];
  deployments: { v: string; t: string; a: string; m: string }[];
  audit: { t: string; s: string; when: string }[];
}
