export interface FoundationProject {
  id: string;
  name: string;
  domain: string;
  url: string;
  status: "draft" | "active" | "paused" | "archived";
  verification_status:
    | "pending"
    | "in_progress"
    | "completed"
    | "failed";
  verification_result: Record<string, unknown> | null;
  audit_status: "pending" | "running" | "completed" | "failed";
  audit_result: Record<string, unknown> | null;
  inventory_result: Record<string, unknown> | null;
  backup_status: "pending" | "in_progress" | "completed" | "failed";
  backup_path: string | null;
  rollback_status: "pending" | "in_progress" | "completed" | "failed";
  rollback_result: Record<string, unknown> | null;
  approval_status:
    | "pending"
    | "approved"
    | "rejected"
    | "changes_requested";
  approved_by: string | null;
  approval_notes: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoundationProjectCreate {
  name: string;
  domain: string;
  url: string;
  status?: "draft" | "active" | "paused" | "archived";
  created_by: string;
}

export interface FoundationProjectUpdate {
  name?: string;
  domain?: string;
  url?: string;
  status?: "draft" | "active" | "paused" | "archived";
  verification_result?: Record<string, unknown>;
  audit_result?: Record<string, unknown>;
  inventory_result?: Record<string, unknown>;
  backup_path?: string;
  rollback_result?: Record<string, unknown>;
  approved_by?: string;
  approval_notes?: string;
  updated_by?: string;
}

export interface VerifyRequest {
  force?: boolean;
}

export interface VerifyResponse {
  project_id: string;
  status: string;
  result: Record<string, unknown>;
}

export interface InventoryRequest {
  scan_depth?: number;
}

export interface InventoryResponse {
  project_id: string;
  status: string;
  result: Record<string, unknown>;
}

export interface AuditRequest {
  audit_type: "full" | "quick" | "custom";
}

export interface AuditResponse {
  project_id: string;
  status: string;
  result: Record<string, unknown>;
}

export interface BackupRequest {
  include_media?: boolean;
  include_database?: boolean;
}

export interface BackupResponse {
  project_id: string;
  status: string;
  backup_path: string;
}

export interface RollbackRequest {
  backup_path: string;
}

export interface RollbackResponse {
  project_id: string;
  status: string;
  result: Record<string, unknown>;
}

export interface ApproveRequest {
  approved: boolean;
  notes?: string;
}

export interface ApproveResponse {
  project_id: string;
  status: string;
  approved_by: string;
}

export interface PaginatedResponse {
  items: FoundationProject[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ---------------------------------------------------------------------------
// Discovery scan types
// ---------------------------------------------------------------------------

export interface ScanRequest {
  url?: string;
  force?: boolean;
}

export interface ScanResponse {
  project_id: string;
  status: string;
  scan_id?: string;
  started_at?: string;
  completed_at?: string;
  result?: Record<string, unknown>;
  error?: string;
}

export interface OverviewResponse {
  project_id: string;
  status: string;
  result: {
    domain: string;
    url: string;
    cms: string;
    version: string;
    ssl: string;
    registrar: string;
    dns: string;
    ip: string;
    health: number;
    performance: number;
    seo: number;
    security: number;
    responsive: number;
    last_scan: string | null;
  };
}

export interface SSLDiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    https_enabled: boolean;
    ssl_rating: string;
    issuer?: string;
    expires_at?: string;
    tls_version?: string;
    days_until_expiry?: number;
    is_expired?: boolean;
    is_self_signed?: boolean;
  };
}

export interface DNSDiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    dns: string;
    ip: string;
    a_records?: string[];
    aaaa_records?: string[];
    mx_records?: string[];
    nameservers?: string[];
    txt_records?: string[];
    spf_record?: string;
    dmarc_record?: string;
    dnssec_enabled?: boolean;
    propagation_status?: string;
  };
}

export interface SEODiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    seo_score: number;
    title?: string;
    meta_description?: string;
    canonical_url?: string;
    robots_meta?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
    og_type?: string;
    twitter_card?: string;
    twitter_title?: string;
    twitter_description?: string;
    twitter_image?: string;
    has_schema_org?: boolean;
    h1_count?: number;
    h2_count?: number;
    images_total?: number;
    images_missing_alt?: number;
  };
}

export interface SecurityDiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    security_score: number;
    https_enabled?: boolean;
    mixed_content_count?: number;
    directory_listing_enabled?: boolean;
    hsts_enabled?: boolean;
    content_security_policy?: string;
    x_frame_options?: string;
    x_content_type_options?: string;
    referrer_policy?: string;
    permissions_policy?: string;
    xss_protection?: boolean;
    cookies_total?: number;
    cookies_secure?: number;
    cookies_httponly?: number;
    cookies_samesite?: number;
  };
}

export interface PerformanceDiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    performance_score: number;
    response_time_ms?: number;
    ttfb_ms?: number;
    redirect_count?: number;
    http_version?: string;
    content_encoding?: string;
    compression_enabled?: boolean;
    final_url?: string;
    status_code?: number;
  };
}

export interface WordPressDiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    cms: string;
    version?: string;
    is_wordpress?: boolean;
    rest_api_enabled?: boolean;
    xmlrpc_enabled?: boolean;
    generator_tag?: string;
    wp_content_detected?: boolean;
    wp_includes_detected?: boolean;
  };
}

export interface RobotsDiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    exists: boolean;
    status_code?: number;
    body?: string;
  };
}

export interface SitemapDiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    exists: boolean;
    status_code?: number;
    url_count?: number;
    sitemap_kind?: string;
  };
}

export interface ResponsiveDiscoveryResponse {
  project_id: string;
  status: string;
  result: {
    responsive_score: number;
    url?: string;
    viewport_meta?: string;
    has_responsive_tag?: boolean;
    screenshot_url?: string;
    screenshot_status?: string;
    screenshot_error?: string;
    screenshot_width?: number;
    screenshot_height?: number;
    screenshot_file_size?: number;
    screenshot_captured_at?: string;
    last_scan?: string | null;
    scanned_at?: string | null;
    scan_status?: string;
    errors?: string[];
    final_url?: string;
    accessibility_score?: number;
  };
}

export interface ScreenshotResponse {
  project_id: string;
  status: string;
  result?: {
    screenshot: string;
    url?: string;
    width?: number;
    height?: number;
    file_size?: number;
    captured_at?: string;
  };
}