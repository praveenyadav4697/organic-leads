import type {
  PerformanceCheck,
  PageSpeedInsight,
  ServerHeader,
  Error404Page,
  AssetFile,
  FontAsset,
} from "@/modules/performance/types";

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

export const performanceApi = {
  listChecks: (params?: {
    foundation_project_id?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: PerformanceCheck[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/performance/checks${query ? `?${query}` : ""}`
    );
  },

  createCheck: (data: { url: string; foundation_project_id?: string }) =>
    request<PerformanceCheck>("/performance/checks", { method: "POST", body: JSON.stringify(data) }),

  getCheck: (checkId: string) =>
    request<PerformanceCheck>(`/performance/checks/${checkId}`),

  updateCheck: (checkId: string, data: Partial<PerformanceCheck>) =>
    request<PerformanceCheck>(`/performance/checks/${checkId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCheck: (checkId: string) =>
    request<void>(`/performance/checks/${checkId}`, { method: "DELETE" }),

  runPageSpeed: (data: { url: string; strategy?: string }) =>
    request<PageSpeedInsight>("/performance/pagespeed", { method: "POST", body: JSON.stringify(data) }),

  listPageSpeed: (params?: {
    foundation_project_id?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: PageSpeedInsight[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/performance/pagespeed${query ? `?${query}` : ""}`
    );
  },

  listServerHeaders: (params?: {
    foundation_project_id?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: ServerHeader[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/performance/server-headers${query ? `?${query}` : ""}`
    );
  },

  createServerHeader: (data: { url: string; header_name: string; header_value?: string; is_security_header?: boolean; foundation_project_id?: string }) =>
    request<ServerHeader>("/performance/server-headers", { method: "POST", body: JSON.stringify(data) }),

  list404Errors: (params?: {
    foundation_project_id?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: Error404Page[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/performance/errors/404${query ? `?${query}` : ""}`
    );
  },

  resolve404: (errorId: string, resolutionUrl: string, resolutionType?: string) =>
    request<Error404Page>(`/performance/errors/404/${errorId}/resolve`, {
      method: "PUT",
      body: JSON.stringify({ resolution_url: resolutionUrl, resolution_type: resolutionType }),
    }),

  listAssets: (params?: {
    foundation_project_id?: string;
    asset_type?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.asset_type) qs.set("asset_type", params.asset_type);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: AssetFile[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/performance/assets${query ? `?${query}` : ""}`
    );
  },

  addAsset: (data: { url: string; asset_type: string; file_size_bytes?: number; foundation_project_id?: string }) =>
    request<AssetFile>("/performance/assets", { method: "POST", body: JSON.stringify(data) }),

  listFonts: (params?: {
    foundation_project_id?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: FontAsset[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/performance/fonts${query ? `?${query}` : ""}`
    );
  },

  addFont: (data: { url: string; font_family?: string; font_weight?: string; font_style?: string; format?: string; file_size_bytes?: number; subset?: string; is_self_hosted?: boolean; foundation_project_id?: string }) =>
    request<FontAsset>("/performance/fonts", { method: "POST", body: JSON.stringify(data) }),
};