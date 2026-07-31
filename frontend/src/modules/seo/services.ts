import type {
  WebPage,
  PageIssue,
  InternalLink,
  SchemaMarkup,
  PageAuditResult,
} from "@/modules/seo/types";

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

export const seoApi = {
  listPages: (params?: {
    foundation_project_id?: string;
    page_status?: string;
    optimization_status?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.page_status) qs.set("page_status", params.page_status);
    if (params?.optimization_status) qs.set("optimization_status", params.optimization_status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: WebPage[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/seo/pages${query ? `?${query}` : ""}`
    );
  },

  getPage: (pageId: string) =>
    request<WebPage>(`/seo/pages/${pageId}`),

  getPageByUrl: (url: string) =>
    request<WebPage>(`/seo/pages?url=${encodeURIComponent(url)}`),

  createPage: (data: { url: string; foundation_project_id?: string }) =>
    request<WebPage>("/seo/pages", { method: "POST", body: JSON.stringify(data) }),

  updatePage: (pageId: string, data: Partial<WebPage>) =>
    request<WebPage>(`/seo/pages/${pageId}`, { method: "PUT", body: JSON.stringify(data) }),

  deletePage: (pageId: string) =>
    request<void>(`/seo/pages/${pageId}`, { method: "DELETE" }),

  listIssues: (webPageId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: PageIssue[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/seo/pages/${webPageId}/issues${query ? `?${query}` : ""}`
    );
  },

  createIssue: (webPageId: string, data: { issue_type: string; severity: string; title: string }) =>
    request<PageIssue>(`/seo/pages/${webPageId}/issues`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  fixIssue: (issueId: string) =>
    request<PageIssue>(`/seo/issues/${issueId}/fix`, { method: "PUT" }),

  listInternalLinks: (sourcePageId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: InternalLink[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/seo/pages/${sourcePageId}/internal-links${query ? `?${query}` : ""}`
    );
  },

  createInternalLink: (sourcePageId: string, data: { target_page_id?: string; target_url?: string; anchor_text?: string; link_type: string; dofollow: boolean }) =>
    request<InternalLink>(`/seo/pages/${sourcePageId}/internal-links`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listSchemaMarkup: (webPageId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: SchemaMarkup[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/seo/pages/${webPageId}/schema${query ? `?${query}` : ""}`
    );
  },

  createSchemaMarkup: (webPageId: string, data: { schema_type: string; schema_json?: Record<string, unknown> }) =>
    request<SchemaMarkup>(`/seo/pages/${webPageId}/schema`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  runPageAudit: (data: { foundation_project_id?: string; urls: string[] }) =>
    request<PageAuditResult>("/seo/audit", { method: "POST", body: JSON.stringify(data) }),
};