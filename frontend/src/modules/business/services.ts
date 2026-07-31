import type {
  BusinessProfile,
  BusinessProfileCreate,
  Competitor,
  CompetitorCreate,
  Keyword,
  KeywordCreate,
  KeywordCluster,
  KeywordClusterCreate,
  KeywordOpportunity,
  SERPResult,
  RankTrackingEntry,
} from "@/modules/business/types";

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

export const businessApi = {
  createProfile: (data: BusinessProfileCreate) =>
    request<BusinessProfile>("/business/profiles", { method: "POST", body: JSON.stringify(data) }),

  listProfiles: (params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: BusinessProfile[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles${query ? `?${query}` : ""}`
    );
  },

  getProfile: (profileId: string) =>
    request<BusinessProfile>(`/business/profiles/${profileId}`),

  updateProfile: (profileId: string, data: Partial<BusinessProfile>) =>
    request<BusinessProfile>(`/business/profiles/${profileId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProfile: (profileId: string) =>
    request<void>(`/business/profiles/${profileId}`, { method: "DELETE" }),

  createCompetitor: (profileId: string, data: CompetitorCreate) =>
    request<Competitor>(`/business/profiles/${profileId}/competitors`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listCompetitors: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: Competitor[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/competitors${query ? `?${query}` : ""}`
    );
  },

  updateCompetitor: (competitorId: string, data: Partial<Competitor>) =>
    request<Competitor>(`/business/competitors/${competitorId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCompetitor: (competitorId: string) =>
    request<void>(`/business/competitors/${competitorId}`, { method: "DELETE" }),

  createKeyword: (profileId: string, data: KeywordCreate) =>
    request<Keyword>(`/business/profiles/${profileId}/keywords`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listKeywords: (profileId: string, params?: { page?: number; page_size?: number; is_tracked?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    if (params?.is_tracked !== undefined) qs.set("is_tracked", String(params.is_tracked));
    const query = qs.toString();
    return request<{ items: Keyword[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/keywords${query ? `?${query}` : ""}`
    );
  },

  updateKeyword: (keywordId: string, data: Partial<Keyword>) =>
    request<Keyword>(`/business/keywords/${keywordId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteKeyword: (keywordId: string) =>
    request<void>(`/business/keywords/${keywordId}`, { method: "DELETE" }),

  createCluster: (profileId: string, data: KeywordClusterCreate) =>
    request<KeywordCluster>(`/business/profiles/${profileId}/clusters`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listClusters: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: KeywordCluster[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/clusters${query ? `?${query}` : ""}`
    );
  },

  listOpportunities: (profileId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: KeywordOpportunity[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/opportunities${query ? `?${query}` : ""}`
    );
  },

  saveSerpResult: (data: { business_profile_id: string; keyword_id?: string; keyword_text?: string; device?: string; country_code?: string; language_code?: string }) =>
    request<SERPResult>("/business/serp", { method: "POST", body: JSON.stringify(data) }),

  listRankTracking: (profileId: string, status?: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: RankTrackingEntry[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/business/profiles/${profileId}/rank-tracking${query ? `?${query}` : ""}`
    );
  },
};