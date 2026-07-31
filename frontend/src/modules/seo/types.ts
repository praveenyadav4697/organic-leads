export interface WebPage {
  id: string;
  url: string;
  normalized_url: string | null;
  page_title: string | null;
  meta_description: string | null;
  h1_count: number;
  h2_count: number;
  h3_count: number;
  heading_structure_score: number | null;
  word_count: number | null;
  reading_time_seconds: number | null;
  has_canonical: boolean;
  canonical_url: string | null;
  has_robots_meta: boolean;
  robots_content: string | null;
  has_schema_markup: boolean;
  schema_types: string[] | null;
  has_og_tags: boolean;
  has_twitter_card: boolean;
  image_count: number;
  images_with_alt: number;
  images_without_alt: number;
  internal_link_count: number;
  outgoing_link_count: number;
  content_score: number | null;
  content_issues: Record<string, unknown> | null;
  page_status: PageStatus;
  optimization_status: OptimizationStatus;
  last_crawled_at: string | null;
  last_optimized_at: string | null;
  foundation_project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PageIssue {
  id: string;
  web_page_id: string;
  issue_type: IssueType;
  severity: Severity;
  title: string;
  description: string | null;
  element_path: string | null;
  element_text: string | null;
  recommendation: string | null;
  auto_fixable: boolean;
  is_fixed: boolean;
  fixed_at: string | null;
  created_at: string;
}

export interface InternalLink {
  id: string;
  source_page_id: string;
  target_page_id: string | null;
  target_url: string | null;
  anchor_text: string | null;
  link_type: string;
  dofollow: boolean;
  created_at: string;
}

export interface SchemaMarkup {
  id: string;
  web_page_id: string;
  schema_type: string;
  schema_json: Record<string, unknown> | null;
  is_valid: boolean | null;
  validation_errors: Record<string, unknown> | null;
  missing_required_fields: string[] | null;
  created_at: string;
}

export interface PageAuditResult {
  pages_audited: number;
  total_issues: number;
  issues_by_severity: Record<string, number>;
  issues_by_type: Record<string, number>;
  average_content_score: number | null;
  completed_at: string;
}

export type PageStatus = "active" | "draft" | "archived" | "redirect" | "removed";
export type OptimizationStatus = "not_started" | "in_progress" | "completed" | "failed";
export type Severity = "critical" | "high" | "medium" | "low";
export type IssueType =
  | "missing_title"
  | "missing_meta_description"
  | "title_too_long"
  | "title_too_short"
  | "meta_too_long"
  | "meta_too_short"
  | "missing_h1"
  | "multiple_h1"
  | "missing_h2"
  | "missing_image_alt"
  | "broken_image"
  | "slow_image"
  | "missing_canonical"
  | "duplicate_canonical"
  | "missing_robots"
  | "noindex_detected"
  | "missing_schema"
  | "invalid_schema"
  | "missing_schema_property"
  | "broken_internal_link"
  | "missing_internal_links"
  | "excessive_internal_links"
  | "missing_og_tags"
  | "missing_twitter_card"
  | "low_content_score"
  | "thin_content"
  | "duplicate_content"
  | "missing_lang_attr"
  | "viewport_not_set";