/** F03 Search Landscape Knowledge — API types (mirror the backend schemas). */

export interface SerpFeature {
  id: string;
  name: string;
  description: string;
  supported: boolean;
  documentation_url: string | null;
  search_engines: string[] | null;
  markets: string[] | null;
  devices: string[] | null;
  version: string;
  source: string | null;
  status: string;
  approval_status: string;
  updated_at: string;
}

export interface AlgorithmUpdate {
  id: string;
  name: string;
  release_date: string | null;
  status: string;
  summary: string;
  priority: string;
  documentation_url: string | null;
  version: string;
  source: string | null;
  item_status: string;
  approval_status: string;
  updated_at: string;
}

export interface SearchOperator {
  id: string;
  operator: string;
  purpose: string;
  example: string | null;
  supported: boolean;
  search_engines: string[] | null;
  notes: string | null;
  version: string;
  source: string | null;
  status: string;
  approval_status: string;
  updated_at: string;
}

export interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  summary: string | null;
  references: Record<string, unknown> | null;
  priority: string;
  requires_approval: boolean;
  version: string;
  source: string | null;
  status: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeVersion {
  id: string;
  entity_type: string;
  entity_id: string;
  version: number;
  change_summary: string | null;
  snapshot: Record<string, unknown> | null;
  status: string;
  approval_status: string;
  source: string | null;
  created_at: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  url: string;
  category: string | null;
  status: string;
  version: string;
  last_synced: string | null;
  last_reviewed: string | null;
  retry_count: number;
  error: string | null;
  correlation_id: string | null;
  last_fetched_at: string | null;
}

export interface SyncLog {
  id: string;
  correlation_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  retry_count: number;
  error: string | null;
  items_created: number;
  items_updated: number;
  details: Record<string, unknown> | null;
  triggered_by: string | null;
}

export interface OverviewStats {
  knowledge_version: string | null;
  last_sync: string | null;
  last_update: string | null;
  total_search_rules: number;
  total_serp_features: number;
  supported_engines: string[];
  algorithm_updates: number;
  pending_approvals: number;
  sources: number;
  markets: string[];
  devices: string[];
}

export type ApprovalEntityType = "knowledge" | "algorithms";
