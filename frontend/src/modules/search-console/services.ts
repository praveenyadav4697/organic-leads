import type {
  SearchConsoleProperty,
  SearchConsolePropertyCreate,
  UrlInspectionResult,
  SitemapEntry,
  ManualAction,
  CrawlError,
  SearchEnhancement,
  PerformanceResponse,
} from "@/modules/search-console/types";

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

export const searchConsoleApi = {
  connectProperty: (data: SearchConsolePropertyCreate) =>
    request<SearchConsoleProperty>("/search-console/properties", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listProperties: (params?: {
    page?: number;
    page_size?: number;
    connection_status?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    if (params?.connection_status) qs.set("connection_status", params.connection_status);
    const query = qs.toString();
    return request<{ items: SearchConsoleProperty[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/search-console/properties${query ? `?${query}` : ""}`
    );
  },

  getProperty: (propertyId: string) =>
    request<SearchConsoleProperty>(`/search-console/properties/${propertyId}`),

  updateProperty: (propertyId: string, data: Partial<SearchConsoleProperty>) =>
    request<SearchConsoleProperty>(`/search-console/properties/${propertyId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteProperty: (propertyId: string) =>
    request<void>(`/search-console/properties/${propertyId}`, { method: "DELETE" }),

  inspectUrl: (propertyId: string, inspectedUrl: string) =>
    request<UrlInspectionResult>(`/search-console/properties/${propertyId}/inspect`, {
      method: "POST",
      body: JSON.stringify({ inspected_url: inspectedUrl }),
    }),

  listSitemaps: (propertyId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: SitemapEntry[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/search-console/properties/${propertyId}/sitemaps${query ? `?${query}` : ""}`
    );
  },

  addSitemap: (propertyId: string, data: { site_url: string; type: string }) =>
    request<SitemapEntry>(`/search-console/properties/${propertyId}/sitemaps`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listManualActions: (propertyId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: ManualAction[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/search-console/properties/${propertyId}/manual-actions${query ? `?${query}` : ""}`
    );
  },

  listCrawlErrors: (propertyId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: CrawlError[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/search-console/properties/${propertyId}/crawl-errors${query ? `?${query}` : ""}`
    );
  },

  listEnhancements: (propertyId: string) =>
    request<SearchEnhancement[]>(`/search-console/properties/${propertyId}/enhancements`),

  getPerformance: (propertyId: string, startDate: string, endDate: string, dimensions?: string[], metrics?: string[]) => {
    const qs = new URLSearchParams();
    qs.set("start_date", startDate);
    qs.set("end_date", endDate);
    if (dimensions) dimensions.forEach((d) => qs.append("dimensions", d));
    if (metrics) metrics.forEach((m) => qs.append("metrics", m));
    return request<PerformanceResponse>(
      `/search-console/properties/${propertyId}/performance?${qs.toString()}`
    );
  },
};