import type {
  KnowledgeOverview,
  PaginatedEntities,
  PaginatedTopics,
  PaginatedKeywords,
  Recommendation,
  SearchTrend,
  QuestionItem,
  Competitor,
  ContentGap,
  ScanLog,
  HistorySnapshot,
  ScanRequest,
  ScanResponse,
  ExportResponse,
  SearchKnowledgeFilters,
} from "@/modules/search-knowledge/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
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

export const searchKnowledgeApi = {
  getOverview: async (filters?: SearchKnowledgeFilters): Promise<KnowledgeOverview> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      searchEngine: filters?.searchEngine,
      topic: filters?.topic,
      category: filters?.category,
      entityType: filters?.entityType,
      searchIntent: filters?.searchIntent,
      status: filters?.status,
    });
    return request<KnowledgeOverview>(`/search-knowledge/overview${qs}`);
  },

  getEntities: async (filters?: SearchKnowledgeFilters & { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string; search?: string }): Promise<PaginatedEntities> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      searchEngine: filters?.searchEngine,
      topic: filters?.topic,
      category: filters?.category,
      entityType: filters?.entityType,
      searchIntent: filters?.searchIntent,
      status: filters?.status,
      search: filters?.search,
      page: filters?.page,
      pageSize: filters?.pageSize,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
    });
    return request<PaginatedEntities>(`/search-knowledge/entities${qs}`);
  },

  getTopics: async (filters?: SearchKnowledgeFilters & { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }): Promise<PaginatedTopics> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      searchEngine: filters?.searchEngine,
      topic: filters?.topic,
      category: filters?.category,
      page: filters?.page,
      pageSize: filters?.pageSize,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
    });
    return request<PaginatedTopics>(`/search-knowledge/topics${qs}`);
  },

  getKeywords: async (filters?: SearchKnowledgeFilters & { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string; search?: string }): Promise<PaginatedKeywords> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      searchEngine: filters?.searchEngine,
      topic: filters?.topic,
      category: filters?.category,
      searchIntent: filters?.searchIntent,
      status: filters?.status,
      search: filters?.search,
      page: filters?.page,
      pageSize: filters?.pageSize,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
    });
    return request<PaginatedKeywords>(`/search-knowledge/keywords${qs}`);
  },

  getIntent: async (filters?: SearchKnowledgeFilters): Promise<{ informational: number; navigational: number; commercial: number; transactional: number; questionBased: number }> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      searchEngine: filters?.searchEngine,
      topic: filters?.topic,
      category: filters?.category,
    });
    return request<{ informational: number; navigational: number; commercial: number; transactional: number; questionBased: number }>(`/search-knowledge/intent${qs}`);
  },

  getCompetitors: async (filters?: SearchKnowledgeFilters): Promise<Competitor[]> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      searchEngine: filters?.searchEngine,
      topic: filters?.topic,
      category: filters?.category,
    });
    return request<Competitor[]>(`/search-knowledge/competitors${qs}`);
  },

  getRecommendations: async (): Promise<Recommendation[]> => {
    return request<Recommendation[]>("/search-knowledge/recommendations");
  },

  getSearchTrends: async (filters?: SearchKnowledgeFilters): Promise<SearchTrend[]> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      searchEngine: filters?.searchEngine,
      topic: filters?.topic,
      category: filters?.category,
    });
    return request<SearchTrend[]>(`/search-knowledge/search-trends${qs}`);
  },

  getQuestions: async (filters?: SearchKnowledgeFilters): Promise<QuestionItem[]> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      topic: filters?.topic,
      searchIntent: filters?.searchIntent,
    });
    return request<QuestionItem[]>(`/search-knowledge/questions${qs}`);
  },

  getContentGaps: async (filters?: SearchKnowledgeFilters): Promise<ContentGap[]> => {
    const qs = buildQueryString({
      website: filters?.website,
      language: filters?.language,
      country: filters?.country,
      searchEngine: filters?.searchEngine,
      topic: filters?.topic,
      category: filters?.category,
    });
    return request<ContentGap[]>(`/search-knowledge/content-gaps${qs}`);
  },

  getLogs: async (filters?: SearchKnowledgeFilters & { page?: number; pageSize?: number }): Promise<{ items: ScanLog[]; total: number; page: number; pageSize: number; totalPages: number }> => {
    const qs = buildQueryString({
      website: filters?.website,
      type: filters?.status,
      page: filters?.page,
      pageSize: filters?.pageSize,
    });
    return request(`/search-knowledge/logs${qs}`);
  },

  getHistory: async (): Promise<HistorySnapshot[]> => {
    return request<HistorySnapshot[]>("/search-knowledge/history");
  },

  runScan: async (data: ScanRequest): Promise<ScanResponse> => {
    return request<ScanResponse>("/search-knowledge/scan", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  exportData: async (format: "csv" | "xlsx" | "pdf", scope?: string): Promise<ExportResponse> => {
    return request<ExportResponse>(`/search-knowledge/export?format=${format}${scope ? `&scope=${scope}` : ""}`, {
      method: "POST",
    });
  },
};