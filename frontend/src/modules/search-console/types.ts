export interface SearchConsoleProperty {
  id: string;
  property_id: string;
  property_name: string;
  property_type: PropertyType;
  site_url: string;
  permission_level: PermissionLevel;
  site_ownership: SiteOwnership;
  verification_method: VerificationMethod | null;
  connection_status: ConnectionStatus;
  is_verified: boolean;
  verified_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UrlInspectionResult {
  id: string;
  property_id: string;
  inspected_url: string;
  coverage_status: string;
  last_crawl_time: string | null;
  crawl_error_code: number | null;
  canonical_url: string | null;
  page_is_indexable: boolean | null;
  has_json_ld: boolean | null;
  has_microdata: boolean | null;
  is_roboted: boolean | null;
  is_noindex: boolean | null;
  is_unreachable: boolean | null;
}

export interface SitemapEntry {
  id: string;
  property_id: string;
  site_url: string;
  type: string;
  is_pending_sitemap: boolean;
  path: string | null;
  is_index_notify_allowed: boolean | null;
  submitted_at: string | null;
  last_downloaded_at: string | null;
  warnings_count: number;
  errors_count: number;
}

export interface ManualAction {
  id: string;
  property_id: string;
  action_type: string;
  action_reason: string | null;
  sites_affected: string[] | null;
  is_partial: boolean;
  resolution: string;
  created_at: string;
  resolved_at: string | null;
}

export interface CrawlError {
  id: string;
  property_id: string;
  platform: string;
  error_type: string;
  error_sub_type: string | null;
  page_url: string;
  referring_url: string | null;
  status_code: number | null;
  detected_at: string;
  resolved: boolean;
  resolved_at: string | null;
}

export interface SearchEnhancement {
  id: string;
  property_id: string;
  enhancement_type: string;
  status: string;
  items_count: number;
  created_at: string;
}

export interface PerformanceRow {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  country_code: string | null;
  device: string | null;
  query: string | null;
  page: string | null;
}

export interface PerformanceResponse {
  rows: PerformanceRow[];
  total_rows: number;
  date_range: { start: string; end: string };
}

export interface SearchConsolePropertyUpdate {
  property_name: string | null;
  verification_method: VerificationMethod | null;
  connection_status: ConnectionStatus | null;
  is_verified: boolean | null;
  verified_at: string | null;
  updated_by: string | null;
}

export type PaginatedResponse<T = unknown> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export interface SearchConsolePropertyCreate {
  property_id: string;
  property_name: string;
  property_type: PropertyType;
  site_url: string;
  permission_level: PermissionLevel;
  site_ownership: SiteOwnership;
  verification_method: VerificationMethod | null;
  connection_status: ConnectionStatus;
  created_by: string;
}