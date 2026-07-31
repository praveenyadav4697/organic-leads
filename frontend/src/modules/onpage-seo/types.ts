export interface SEOOverview {
  overall_score: number;
  optimized_pages: number;
  pages_with_issues: number;
  critical_errors: number;
  warnings: number;
  passed_checks: number;
  avg_readability: number;
  missing_meta_tags: number;
  duplicate_titles: number;
  broken_links: number;
  schema_coverage: number;
  answer_readiness_score: number;
  ai_recommendations_count: number;
  last_scan: string | null;
  score_distribution: { range: string; count: number }[];
  issue_severity: { severity: string; count: number }[];
  optimization_progress: { category: string; progress: number }[];
  readability_trend: { date: string; score: number }[];
  page_performance: { page: string; score: number; load_time: number }[];
}

export interface SEOPage {
  id: string;
  website_id: string;
  url: string;
  path: string;
  seo_score: number | null;
  status: "scanned" | "error" | "pending" | "skipped";
  primary_keyword: string | null;
  word_count: number | null;
  readability_score: number | null;
  has_schema: boolean;
  has_canonical: boolean;
  is_indexed: boolean | null;
  last_audit: string | null;
  meta_title: string | null;
  meta_description: string | null;
  h1_count: number | null;
  h2_count: number | null;
  h3_count: number | null;
  image_count: number | null;
  images_missing_alt: number | null;
  internal_links_count: number | null;
  external_links_count: number | null;
  broken_links_count: number | null;
  content_quality_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface SEOPageCreate {
  website_id: string;
  url: string;
  path: string;
}

export interface SEOPageUpdate {
  seo_score?: number | null;
  status?: string | null;
  primary_keyword?: string | null;
  word_count?: number | null;
  readability_score?: number | null;
  has_schema?: boolean | null;
  has_canonical?: boolean | null;
  is_indexed?: boolean | null;
  meta_title?: string | null;
  meta_description?: string | null;
  h1_count?: number | null;
  h2_count?: number | null;
  h3_count?: number | null;
  image_count?: number | null;
  images_missing_alt?: number | null;
  internal_links_count?: number | null;
  external_links_count?: number | null;
  broken_links_count?: number | null;
  content_quality_score?: number | null;
}

export interface SEOAuditFinding {
  id: string;
  page_id: string;
  category: string;
  check_name: string;
  status: "passed" | "failed" | "warning";
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  recommendation: string | null;
  element: string | null;
  expected_value: string | null;
  actual_value: string | null;
  created_at: string;
}

export interface SEOKeyword {
  id: string;
  page_id: string;
  keyword_text: string;
  type: "primary" | "secondary" | "missing" | "opportunity";
  density: number | null;
  placement: string | null;
  occurrences: number | null;
  recommended_density: number | null;
  status: "optimal" | "underused" | "overused" | "missing";
  created_at: string;
}

export interface SEMetaTag {
  id: string;
  page_id: string;
  tag_type: "title" | "description" | "og_title" | "og_description" | "og_image" | "twitter_card" | "twitter_title" | "twitter_description" | "twitter_image" | "robots" | "canonical";
  tag_name: string;
  tag_value: string | null;
  is_present: boolean;
  length: number | null;
  max_length: number;
  is_valid: boolean;
  is_duplicate: boolean;
  created_at: string;
}

export interface SEHeading {
  id: string;
  page_id: string;
  level: number;
  text: string;
  is_duplicate: boolean;
  is_missing: boolean;
  position: number;
  created_at: string;
}

export interface SEContent {
  id: string;
  page_id: string;
  word_count: number | null;
  paragraph_count: number | null;
  avg_paragraph_length: number | null;
  readability_score: number | null;
  readability_grade: string | null;
  has_duplicate_content: boolean;
  has_thin_content: boolean;
  content_freshness_days: number | null;
  grammar_issues: number | null;
  ai_suggestions: string[];
  created_at: string;
}

export interface SEImage {
  id: string;
  page_id: string;
  src: string;
  alt_text: string | null;
  has_alt: boolean;
  file_size_kb: number | null;
  is_compressed: boolean | null;
  uses_lazy_loading: boolean;
  is_responsive: boolean;
  format: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface SEInternalLink {
  id: string;
  page_id: string;
  target_url: string;
  anchor_text: string;
  is_broken: boolean;
  link_count: number | null;
  created_at: string;
}

export interface SEExternalLink {
  id: string;
  page_id: string;
  target_url: string;
  is_broken: boolean;
  is_nofollow: boolean;
  is_sponsored: boolean;
  is_ugc: boolean;
  created_at: string;
}

export interface SECanonical {
  id: string;
  page_id: string;
  canonical_url: string | null;
  is_present: boolean;
  is_valid: boolean;
  is_duplicate: boolean;
  created_at: string;
}

export interface SERobots {
  id: string;
  page_id: string;
  robots_txt_present: boolean;
  robots_meta: string | null;
  is_noindex: boolean;
  is_nofollow: boolean;
  blocked_resources: string[];
  created_at: string;
}

export interface SESitemap {
  id: string;
  page_id: string;
  sitemap_url: string | null;
  is_present: boolean;
  page_in_sitemap: boolean;
  last_submitted: string | null;
  submission_status: "pending" | "submitted" | "failed" | "unknown";
  created_at: string;
}

export interface SESchema {
  id: string;
  page_id: string;
  schema_type: string;
  is_present: boolean;
  is_valid: boolean;
  error_count: number;
  warning_count: number;
  errors: string[];
  warnings: string[];
  created_at: string;
}

export interface SEAnswerReadiness {
  id: string;
  page_id: string;
  is_featured_snippet_ready: boolean;
  faq_optimized: boolean;
  ai_search_readiness_score: number | null;
  voice_search_optimized: boolean;
  question_coverage_count: number;
  has_structured_answers: boolean;
  created_at: string;
}

export interface SERecommendation {
  id: string;
  page_id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  estimated_traffic_gain: number | null;
  estimated_ranking_improvement: number | null;
  difficulty: "easy" | "moderate" | "hard";
  recommended_action: string;
  status: "pending" | "approved" | "rejected" | "completed";
  category: string;
  created_at: string;
  updated_at: string;
}

export interface SEOHistoryEntry {
  id: string;
  page_id: string;
  scan_type: string;
  status: "completed" | "failed" | "running";
  findings_count: number;
  score_before: number | null;
  score_after: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  correlation_id: string;
}

export interface SEOLogsEntry {
  id: string;
  page_id: string;
  type: "audit" | "api" | "validation" | "processing" | "error" | "warning";
  message: string;
  timestamp: string;
  details?: string;
  correlation_id: string;
}

export interface SEOFilters {
  search?: string;
  website?: string;
  page?: string;
  category?: string;
  seo_score_min?: number;
  seo_score_max?: number;
  status?: string;
  severity?: string;
  keyword?: string;
  template?: string;
  language?: string;
  content_type?: string;
  schema_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface SEOScanRequest {
  website_id: string;
  pages?: string[];
  scan_type?: string;
  include_schema?: boolean;
  include_content?: boolean;
  include_images?: boolean;
}

export interface SEOScanResponse {
  scan_id: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  pages_scanned: number;
  issues_found: number;
}

export interface SEOExportResponse {
  download_url: string;
  format: "csv" | "xlsx" | "pdf";
  expires_at: string;
}

export interface BulkOptimizationRequest {
  page_ids: string[];
  action: "update_meta" | "optimize_images" | "update_schema" | "update_canonical" | "update_internal_links" | "update_keywords";
  data: Record<string, unknown>;
}

export interface BulkOptimizationResult {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: { page_id: string; status: string; message: string }[];
}

export interface ApprovalRequest {
  id: string;
  page_id: string;
  changes: Record<string, unknown>;
  approved_by: string | null;
  approved_at: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}