import type {
  AlgorithmUpdate,
  ApprovalEntityType,
  KnowledgeItem,
  KnowledgeSource,
  KnowledgeVersion,
  OverviewStats,
  SearchOperator,
  SerpFeature,
  SyncLog,
} from "@/modules/search-landscape/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.detail || res.statusText || "An error occurred");
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const searchLandscapeApi = {
  getOverview: () => request<OverviewStats>("/search-landscape/overview"),

  getSerpFeatures: () => request<SerpFeature[]>("/search-landscape/serp-features"),

  getAlgorithms: () => request<AlgorithmUpdate[]>("/search-landscape/algorithms"),

  getOperators: () => request<SearchOperator[]>("/search-landscape/operators"),

  getKnowledge: () => request<KnowledgeItem[]>("/search-landscape/knowledge"),

  getDocumentation: () => request<KnowledgeSource[]>("/search-landscape/documentation"),

  getVersions: () => request<KnowledgeVersion[]>("/search-landscape/versions"),

  getSyncLogs: () => request<SyncLog[]>("/search-landscape/sync-logs"),

  sync: (triggeredBy = "system") =>
    request<SyncLog>("/search-landscape/sync", {
      method: "POST",
      body: JSON.stringify({ triggered_by: triggeredBy }),
    }),

  approve: (entityType: ApprovalEntityType, id: string, approved: boolean) =>
    request<{ id: string; approval_status: string }>(
      `/search-landscape/${entityType}/${id}/${approved ? "approve" : "reject"}`,
      { method: "POST", body: JSON.stringify({ approved_by: "system" }) }
    ),
};
