import type {
  SEOOverview,
  SEOPage,
  SEOPageCreate,
  SEOPageUpdate,
  SEOAuditFinding,
  SEOKeyword,
  SEMetaTag,
  SEHeading,
  SEContent,
  SEImage,
  SEInternalLink,
  SEExternalLink,
  SECanonical,
  SERobots,
  SESitemap,
  SESchema,
  SEAnswerReadiness,
  SERecommendation,
  SEOHistoryEntry,
  SEOLogsEntry,
  SEOFilters,
  SEOScanRequest,
  SEOScanResponse,
  SEOExportResponse,
  BulkOptimizationRequest,
  BulkOptimizationResult,
  ApprovalRequest,
} from "@/modules/onpage-seo/types";

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

export const onpageSeoApi = {
  getOverview: async (filters?: SEOFilters): Promise<SEOOverview> => {
    const qs = buildQueryString({
      website: filters?.website,
      page: filters?.page,
      category: filters?.category,
      seo_score_min: filters?.seo_score_min,
      seo_score_max: filters?.seo_score_max,
      status: filters?.status,
      severity: filters?.severity,
      keyword: filters?.keyword,
      template: filters?.template,
      language: filters?.language,
      content_type: filters?.content_type,
      schema_type: filters?.schema_type,
      date_from: filters?.date_from,
      date_to: filters?.date_to,
    });
    return request<SEOOverview>(`/onpage/overview${qs}`);
  },

  listPages: (filters?: SEOFilters & { page?: number; page_size?: number; sortBy?: string; sortOrder?: string; search?: string }) => {
    const qs = buildQueryString({
      website: filters?.website,
      search: filters?.search,
      sortBy: filters?.sortBy,
      sortOrder: filters?.sortOrder,
      page: filters?.page,
      page_size: filters?.page_size,
      status: filters?.status,
      seo_score_min: filters?.seo_score_min,
      seo_score_max: filters?.seo_score_max,
      category: filters?.category,
      keyword: filters?.keyword,
      template: filters?.template,
      language: filters?.language,
      content_type: filters?.content_type,
      schema_type: filters?.schema_type,
    });
    return request<{ items: SEOPage[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/onpage/pages${qs}`
    );
  },

  getPage: (pageId: string) => request<SEOPage>(`/onpage/pages/${pageId}`),

  createPage: (data: SEOPageCreate) =>
    request<SEOPage>("/onpage/pages", { method: "POST", body: JSON.stringify(data) }),

  updatePage: (pageId: string, data: Partial<SEOPage>) =>
    request<SEOPage>(`/onpage/pages/${pageId}`, { method: "PUT", body: JSON.stringify(data) }),

  deletePage: (pageId: string) => request<void>(`/onpage/pages/${pageId}`, { method: "DELETE" }),

  getAudit: (pageId: string) =>
    request<{ items: SEOAuditFinding[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/onpage/pages/${pageId}/audit`
    ),

  getKeywords: (pageId: string) => request<SEOKeyword[]>(`/onpage/pages/${pageId}/keywords`),

  getMetaTags: (pageId: string) => request<SEMetaTag[]>(`/onpage/pages/${pageId}/meta`),

  getHeadings: (pageId: string) => request<SEHeading[]>(`/onpage/pages/${pageId}/headings`),

  getContent: (pageId: string) => request<SEContent>(`/onpage/pages/${pageId}/content`),

  getImages: (pageId: string) => request<SEImage[]>(`/onpage/pages/${pageId}/images`),

  getInternalLinks: (pageId: string) => request<SEInternalLink[]>(`/onpage/pages/${pageId}/internal-links`),

  getExternalLinks: (pageId: string) => request<SEExternalLink[]>(`/onpage/pages/${pageId}/external-links`),

  getCanonical: (pageId: string) => request<SECanonical>(`/onpage/pages/${pageId}/canonical`),

  getRobots: (pageId: string) => request<SERobots>(`/onpage/pages/${pageId}/robots`),

  getSitemap: (pageId: string) => request<SESitemap>(`/onpage/pages/${pageId}/sitemap`),

  getSchema: (pageId: string) => request<SESchema[]>(`/onpage/pages/${pageId}/schema`),

  getAnswerReadiness: (pageId: string) => request<SEAnswerReadiness>(`/onpage/pages/${pageId}/answer-readiness`),

  getRecommendations: (pageId: string) => request<SERecommendation[]>(`/onpage/pages/${pageId}/recommendations`),

  updateRecommendation: (recommendationId: string, data: { status: string }) =>
    request<SERecommendation>(`/onpage/recommendations/${recommendationId}`, { method: "PUT", body: JSON.stringify(data) }),

  getHistory: (pageId: string) => request<SEOHistoryEntry[]>(`/onpage/pages/${pageId}/history`),

  getLogs: (filters?: SEOFilters & { page?: number; page_size?: number }) => {
    const qs = buildQueryString({
      website: filters?.website,
      page_id: filters?.page,
      page: filters?.page,
      page_size: filters?.page_size,
      type: filters?.status,
    });
    return request<{ items: SEOLogsEntry[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/onpage/logs${qs}`
    );
  },

  runScan: (data: SEOScanRequest): Promise<SEOScanResponse> =>
    request<SEOScanResponse>("/onpage/scan", { method: "POST", body: JSON.stringify(data) }),

  verifyFixes: (pageId: string) =>
    request<{ verified: number; failed: number; message: string }>(`/onpage/pages/${pageId}/verify`, { method: "POST" }),

  bulkOptimize: (data: BulkOptimizationRequest): Promise<BulkOptimizationResult> =>
    request<BulkOptimizationResult>("/onpage/bulk-optimize", { method: "POST", body: JSON.stringify(data) }),

  approveChanges: (pageId: string, data: { items: string[]; action: "approve" | "reject" | "mark_complete" }) =>
    request<{ approved: number; rejected: number; completed: number }>(`/onpage/pages/${pageId}/approve`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  exportData: (pageId: string, format: "csv" | "xlsx" | "pdf", scope?: string) =>
    request<SEOExportResponse>(`/onpage/pages/${pageId}/export?format=${format}${scope ? `&scope=${scope}` : ""}`, {
      method: "POST",
    }),
};