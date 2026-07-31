export interface MobileTest {
  id: string;
  url: string;
  device_type: DeviceType;
  viewport_width: number | null;
  viewport_height: number | null;
  pixel_ratio: number | null;
  touch_support: boolean | null;
  orientation: string | null;
  performance_score: number | null;
  usability_score: number | null;
  touch_target_issues_count: number | null;
  viewport_issues_count: number | null;
  form_issues_count: number | null;
  status: MobileTestStatus;
  test_config: Record<string, unknown> | null;
  foundation_project_id: string | null;
  created_by: string;
  created_at: string;
  finished_at: string | null;
}

export interface TouchTargetIssue {
  id: string;
  mobile_test_id: string;
  element_selector: string | null;
  element_text: string | null;
  target_size_width: number | null;
  target_size_height: number | null;
  min_target_size: number;
  gap_to_adjacent: number | null;
  status: string;
  recommendation: string | null;
  created_at: string;
}

export interface ViewportIssue {
  id: string;
  mobile_test_id: string;
  url: string;
  issue_type: string;
  description: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  viewport_scale: number | null;
  status: string;
  created_at: string;
}

export interface MobileFormIssue {
  id: string;
  mobile_test_id: string;
  form_selector: string | null;
  field_label: string | null;
  field_type: string | null;
  issue_type: string;
  description: string | null;
  status: string;
  created_at: string;
}

export interface MobileEvent {
  id: string;
  mobile_test_id: string;
  event_type: string;
  event_name: string | null;
  element_selector: string | null;
  tracked: boolean;
  issue: string | null;
  created_at: string;
}

export type MobileTestStatus = "passed" | "failed" | "warning" | "not_tested";
export type DeviceType = "mobile" | "tablet" | "desktop";