export interface AuditRun {
  id: string;
  foundation_project_id: string | null;
  audit_type: AuditType;
  audit_name: string;
  status: AuditStatus;
  overall_score: number | null;
  pages_audited: number | null;
  issues_found: number | null;
  issues_critical: number | null;
  issues_high: number | null;
  issues_medium: number | null;
  issues_low: number | null;
  summary: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
}

export interface TechnicalIssue {
  id: string;
  audit_id: string;
  foundation_project_id: string | null;
  category: IssueCategory;
  severity: Severity;
  title: string;
  description: string | null;
  affected_url: string | null;
  element_selector: string | null;
  current_value: string | null;
  expected_value: string | null;
  recommendation: string | null;
  resource_url: string | null;
  is_automatable: boolean;
  created_at: string;
}

export interface AuditFinding {
  id: string;
  audit_id: string;
  issue_id: string | null;
  finding_type: string;
  title: string;
  description: string | null;
  pages_affected: number | null;
  impact_score: number | null;
  effort_to_fix: string | null;
  recommendation: string | null;
  related_url: string | null;
  priority_order: number | null;
  created_at: string;
}

export interface BlackHatDetection {
  id: string;
  audit_id: string;
  foundation_project_id: string | null;
  technique: string;
  technique_category: string;
  severity: Severity;
  url: string | null;
  description: string | null;
  evidence: string | null;
  impact: string | null;
  recommendation: string | null;
  is_active: boolean;
  detected_at: string;
}

export interface GreyHatDetection {
  id: string;
  audit_id: string;
  foundation_project_id: string | null;
  technique: string;
  technique_category: string;
  severity: Severity;
  url: string | null;
  description: string | null;
  evidence: string | null;
  risk_assessment: string | null;
  recommendation: string | null;
  detected_at: string;
}

export interface AuditExportResult {
  export_url: string;
  format: string;
  record_count: number;
  generated_at: string;
}

export type AuditStatus = "pending" | "running" | "completed" | "failed" | "partial";
export type AuditType = "full" | "quick" | "custom";
export type IssueCategory = "critical" | "high" | "medium" | "low" | "informational";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type HatCategory = "black_hat" | "grey_hat" | "white_hat";

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}