import type {
  BusinessProfile,
  BusinessProfileCreate,
  BusinessProfileUpdate,
  Competitor,
  CompetitorCreate,
  CompetitorUpdate,
  Keyword,
  KeywordCreate,
  KeywordUpdate,
  KeywordCluster,
  KeywordClusterCreate,
  KeywordClusterUpdate,
  KeywordOpportunity,
  SERPResult,
  RankTrackingEntry,
  KeywordResearchResult,
  ContentGap,
  SearchTrend,
  Recommendation,
  MarketInsight,
  BusinessKeywordCompetitorFilters,
  ResearchScanRequest,
  ResearchScanResponse,
  ExportResponse,
  ResearchHistoryEntry,
} from "@/modules/business-keyword-competitor/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || res.statusText || "An error occurred");
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  });
  const query = qs.toString();
  return query ? `?${query}` : "";
}

export const businessKeywordCompetitorApi = {
  getOverview: async (filters?: BusinessKeywordCompetitorFilters): Promise<MarketInsight> => {
    const qs = buildQueryString({
      website: filters?.website,
      business: filters?.business,
      country: filters?.country,
      city: filters?.city,
      language: filters?.language,
      industry: filters?.industry,
      keyword_type: filters?.keyword_type,
      intent: filters?.intent,
      competition: filters?.competition,
      difficulty: filters?.difficulty,
      search_volume_min: filters?.search_volume_min,
      search_volume_max: filters?.search_volume_max,
      priority: filters?.priority,
      ranking_min: filters?.ranking_min,
      ranking_max: filters?.ranking_max,
      competitor: filters?.competitor,
      date_from: filters?.date_from,
      date_to: filters?.date_to,
    });
    return request<MarketInsight>(`/business/overview${qs}`);
  },

  listProfiles: (params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: BusinessProfile[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles${query ? `?${query}` : ""}`
    );
  },

  getProfile: (profileId: string) => request<BusinessProfile>(`/business/profiles/${profileId}`),

  createProfile: (data: BusinessProfileCreate) =>
    request<BusinessProfile>("/business/profiles", { method: "POST", body: JSON.stringify(data) }),

  updateProfile: (profileId: string, data: Partial<BusinessProfile>) =>
    request<BusinessProfile>(`/business/profiles/${profileId}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteProfile: (profileId: string) => request<void>(`/business/profiles/${profileId}`, { method: "DELETE" }),

  listKeywords: (profileId: string, filters?: BusinessKeywordCompetitorFilters & { page?: number; page_size?: number; sortBy?: string; sortOrder?: string; search?: string }) => {
    const qs = buildQueryString({
      search: filters?.search,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
      page: filters?.page,
      page_size: filters?.page_size,
      intent: filters?.intent,
      competition: filters?.competition,
      difficulty: filters?.difficulty,
      priority: filters?.priority,
      keyword_type: filters?.keyword_type,
    });
    return request<{ items: Keyword[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/keywords${qs}`
    );
  },

  createKeyword: (profileId: string, data: KeywordCreate) =>
    request<Keyword>(`/business/profiles/${profileId}/keywords`, { method: "POST", body: JSON.stringify(data) }),

  updateKeyword: (keywordId: string, data: Partial<Keyword>) =>
    request<Keyword>(`/business/keywords/${keywordId}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteKeyword: (keywordId: string) => request<void>(`/business/keywords/${keywordId}`, { method: "DELETE" }),

  listClusters: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: KeywordCluster[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/clusters${query ? `?${query}` : ""}`
    );
  },

  createCluster: (profileId: string, data: KeywordClusterCreate) =>
    request<KeywordCluster>(`/business/profiles/${profileId}/clusters`, { method: "POST", body: JSON.stringify(data) }),

  updateCluster: (clusterId: string, data: Partial<KeywordCluster>) =>
    request<KeywordCluster>(`/business/clusters/${clusterId}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteCluster: (clusterId: string) => request<void>(`/business/clusters/${clusterId}`, { method: "DELETE" }),

  listOpportunities: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: KeywordOpportunity[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/opportunities${query ? `?${query}` : ""}`
    );
  },

  listCompetitors: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: Competitor[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/competitors${query ? `?${query}` : ""}`
    );
  },

  createCompetitor: (profileId: string, data: CompetitorCreate) =>
    request<Competitor>(`/business/profiles/${profileId}/competitors`, { method: "POST", body: JSON.stringify(data) }),

  updateCompetitor: (competitorId: string, data: CompetitorUpdate) =>
    request<Competitor>(`/business/competitors/${competitorId}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteCompetitor: (competitorId: string) => request<void>(`/business/competitors/${competitorId}`, { method: "DELETE" }),

  listRankTracking: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: RankTrackingEntry[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/rank-tracking${query ? `?${query}` : ""}`
    );
  },

  listSERPs: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: SERPResult[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/serp${query ? `?${query}` : ""}`
    );
  },

  listContentGaps: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: ContentGap[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/content-gaps${query ? `?${query}` : ""}`
    );
  },

  listSearchTrends: (profileId: string) =>
    request<SearchTrend[]>(`/business/profiles/${profileId}/search-trends`),

  listRecommendations: (profileId: string) =>
    request<Recommendation[]>(`/business/profiles/${profileId}/recommendations`),

  updateRecommendation: (recommendationId: string, data: { status: string }) =>
    request<Recommendation>(`/business/recommendations/${recommendationId}`, { method: "PUT", body: JSON.stringify(data) }),

  listHistory: (profileId: string) =>
    request<ResearchHistoryEntry[]>(`/business/profiles/${profileId}/history`),

  runResearch: (data: ResearchScanRequest): Promise<ResearchScanResponse> =>
    request<ResearchScanResponse>("/business/research", { method: "POST", body: JSON.stringify(data) }),

  exportData: (profileId: string, format: "csv" | "xlsx" | "pdf", scope?: string) =>
    request<ExportResponse>(`/business/profiles/${profileId}/export?format=${format}${scope ? `&scope=${scope}` : ""}`, {
      method: "POST",
    }),

  approveResults: (profileId: string, data: { items: string[]; action: "approve" | "reject" | "mark_complete" }) =>
    request<{ approved: number; rejected: number; completed: number }>(`/business/profiles/${profileId}/approve`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};