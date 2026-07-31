export interface PerformanceCheck {
  id: string;
  url: string;
  foundation_project_id: string | null;
  lighthouse_performance_score: number | null;
  lighthouse_best_practices_score: number | null;
  lighthouse_accessibility_score: number | null;
  lighthouse_seo_score: number | null;
  lighthouse_pwa_score: number | null;
  lcp_value: number | null;
  lcp_status: string | null;
  inp_value: number | null;
  inp_status: string | null;
  cls_value: number | null;
  cls_status: string | null;
  tbt_value: number | null;
  fcp_value: number | null;
  si_value: number | null;
  ttfb_value: number | null;
  total_byte_weight: number | null;
  request_count: number | null;
  dom_size: number | null;
  image_count: number | null;
  total_image_weight: number | null;
  js_bytes: number | null;
  css_bytes: number | null;
  font_bytes: number | null;
  cached_content: boolean | null;
  gzip_enabled: boolean | null;
  brotli_enabled: boolean | null;
  minification_enabled: boolean | null;
  render_blocking_resources: number | null;
  uses_text_compression: boolean | null;
  uses_efficient_cache_policy: boolean | null;
  uses_redirects: boolean | null;
  redirect_count: number | null;
  has_https: boolean | null;
  https_status: string | null;
  http_version: string | null;
  canonical_url: string | null;
  has_canonical_tag: boolean | null;
  has_hreflang: boolean | null;
  hreflang_tags_count: number | null;
  created_at: string;
  finished_at: string | null;
}

export interface PageSpeedInsight {
  id: string;
  url: string;
  strategy: string;
  performance_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  seo_score: number | null;
  pwa_score: number | null;
  metrics: Record<string, unknown> | null;
  audits: Record<string, unknown> | null;
  created_at: string;
}

export interface ServerHeader {
  id: string;
  url: string;
  header_name: string;
  header_value: string | null;
  is_security_header: boolean;
  status: string;
  foundation_project_id: string | null;
  created_at: string;
}

export interface Error404Page {
  id: string;
  url: string;
  referrer_url: string | null;
  found_at: string | null;
  resolved: boolean;
  resolution_url: string | null;
  resolution_type: string | null;
  foundation_project_id: string | null;
  created_at: string;
}

export interface AssetFile {
  id: string;
  url: string;
  asset_type: string;
  file_size_bytes: number | null;
  gzip_size_bytes: number | null;
  compression_ratio: number | null;
  cache_ttl: number | null;
  is_cacheable: boolean | null;
  has_etag: boolean | null;
  has_last_modified: boolean | null;
  foundation_project_id: string | null;
  created_at: string;
}

export interface FontAsset {
  id: string;
  url: string;
  font_family: string | null;
  font_weight: string | null;
  font_style: string | null;
  format: string | null;
  file_size_bytes: number | null;
  subset: string | null;
  is_self_hosted: boolean | null;
  foundation_project_id: string | null;
  created_at: string;
}