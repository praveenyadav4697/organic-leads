import type {
  GoogleProductConnection,
  TagManagerVariable,
  TagManagerTrigger,
  TagManagerTag,
  GoogleAdsAccount,
  AdSenseAccount,
  TrendsQuery,
} from "@/modules/google-products/types";

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

export const googleProductsApi = {
  connectProduct: (data: { product_type: string; product_name: string; property_id?: string; tracking_id?: string; account_id?: string; connection_status?: string; is_active?: boolean; created_by: string }) =>
    request<GoogleProductConnection>("/google-products/connections", { method: "POST", body: JSON.stringify(data) }),

  listConnections: (params?: { product_type?: string; connection_status?: string; health_status?: string; page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.product_type) qs.set("product_type", params.product_type);
    if (params?.connection_status) qs.set("connection_status", params.connection_status);
    if (params?.health_status) qs.set("health_status", params.health_status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: GoogleProductConnection[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/google-products/connections${query ? `?${query}` : ""}`
    );
  },

  getConnection: (connId: string) =>
    request<GoogleProductConnection>(`/google-products/connections/${connId}`),

  updateConnection: (connId: string, data: Partial<GoogleProductConnection>) =>
    request<GoogleProductConnection>(`/google-products/connections/${connId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteConnection: (connId: string) =>
    request<void>(`/google-products/connections/${connId}`, { method: "DELETE" }),

  syncConnection: (connId: string) =>
    request<GoogleProductConnection>(`/google-products/connections/${connId}/sync`, { method: "POST" }),

  createGtmVariable: (connId: string, data: { variable_name: string; variable_type: string; is_firing?: boolean; configuration?: Record<string, unknown> }) =>
    request<TagManagerVariable>(`/google-products/connections/${connId}/gtm-variables`, { method: "POST", body: JSON.stringify(data) }),

  listGtmVariables: (connId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: TagManagerVariable[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/google-products/connections/${connId}/gtm-variables${query ? `?${query}` : ""}`
    );
  },

  updateGtmVariable: (varId: string, data: Partial<TagManagerVariable>) =>
    request<TagManagerVariable>(`/gtm-variables/${varId}`, { method: "PUT", body: JSON.stringify(data) }),

  createGtmTrigger: (connId: string, data: { trigger_name: string; trigger_type: string; is_firing?: boolean; configuration?: Record<string, unknown> }) =>
    request<TagManagerTrigger>(`/google-products/connections/${connId}/gtm-triggers`, { method: "POST", body: JSON.stringify(data) }),

  listGtmTriggers: (connId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: TagManagerTrigger[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/google-products/connections/${connId}/gtm-triggers${query ? `?${query}` : ""}`
    );
  },

  createGtmTag: (connId: string, data: { tag_name: string; tag_type: string; is_firing?: boolean; configuration?: Record<string, unknown> }) =>
    request<TagManagerTag>(`/google-products/connections/${connId}/gtm-tags`, { method: "POST", body: JSON.stringify(data) }),

  listGtmTags: (connId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: TagManagerTag[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/google-products/connections/${connId}/gtm-tags${query ? `?${query}` : ""}`
    );
  },

  updateGtmTag: (tagId: string, data: Partial<TagManagerTag>) =>
    request<TagManagerTag>(`/gtm-tags/${tagId}`, { method: "PUT", body: JSON.stringify(data) }),

  createAdsAccount: (connId: string, data: { account_id: string; account_name?: string; status?: string; currency_code?: string; time_zone?: string }) =>
    request<GoogleAdsAccount>(`/google-products/connections/${connId}/google-ads`, { method: "POST", body: JSON.stringify(data) }),

  listAdsAccounts: (connId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: GoogleAdsAccount[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/google-products/connections/${connId}/google-ads${query ? `?${query}` : ""}`
    );
  },

  updateAdsAccount: (accountId: string, data: Partial<GoogleAdsAccount>) =>
    request<GoogleAdsAccount>(`/google-ads/${accountId}`, { method: "PUT", body: JSON.stringify(data) }),

  createAdSenseAccount: (connId: string, data: { account_id: string; site_url?: string; status?: string }) =>
    request<AdSenseAccount>(`/google-products/connections/${connId}/adsense`, { method: "POST", body: JSON.stringify(data) }),

  listAdSenseAccounts: (connId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: AdSenseAccount[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/google-products/connections/${connId}/adsense${query ? `?${query}` : ""}`
    );
  },

  updateAdSenseAccount: (accountId: string, data: Partial<AdSenseAccount>) =>
    request<AdSenseAccount>(`/adsense/${accountId}`, { method: "PUT", body: JSON.stringify(data) }),

  createTrendsQuery: (connId: string, data: { query: string; region_code?: string; country_code?: string; timeframe?: string }) =>
    request<TrendsQuery>(`/google-products/connections/${connId}/trends`, { method: "POST", body: JSON.stringify(data) }),

  listTrendsQueries: (connId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: TrendsQuery[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/google-products/connections/${connId}/trends${query ? `?${query}` : ""}`
    );
  },
};