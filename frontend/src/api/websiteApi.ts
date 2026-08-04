import type {
  WebsiteRegistrationCreate,
  WebsiteRegistrationResponse,
  WebsiteScanRequest,
  WebsiteScanResponse,
  WebsiteWorkflowRequest,
  WebsiteWorkflowStatusResponse,
  DiagnosticsRunResponse,
  PluginScanEntry,
  ThemeScanEntry,
  ScanHistoryEntry,
  WebsitePerformance,
} from "@/types/website";
import type {
  Theme,
  ThemeDetail,
  ThemeInstallResponse,
  ThemeActivateResponse,
  ThemeDeleteResponse,
  ThemeUpdateResponse,
  Plugin,
  PluginDetail,
  PluginHealth,
  PluginSearchResponse,
  PluginOperationResult,
  PluginLog,
  PluginSecurityIssue,
  FormManagerForm,
  FormOperationResult,
  FormManagerHealth,
  FormLog,
} from "@/modules/website-foundation/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    headers: {
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.message || body.detail || res.statusText || "An error occurred";
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const websiteApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    environment?: string;
  }): Promise<{
    items: WebsiteRegistrationResponse[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    if (params?.environment) qs.set("environment", params.environment);
    const query = qs.toString();

    const response = await request<any>(`/websites${query ? `?${query}` : ""}`);

    if (Array.isArray(response)) {
      return {
        items: response as WebsiteRegistrationResponse[],
        total: response.length,
        page: 1,
        page_size: response.length,
        total_pages: 1,
      };
    }

    return {
      items: Array.isArray(response?.items) ? response.items : [],
      total: response?.total ?? (Array.isArray(response?.items) ? response.items.length : 0),
      page: response?.page ?? 1,
      page_size:
        response?.page_size ?? (Array.isArray(response?.items) ? response.items.length : 0),
      total_pages: response?.total_pages ?? 1,
    };
  },

  get: async (id: string): Promise<WebsiteRegistrationResponse> => {
    return request<WebsiteRegistrationResponse>(`/websites/${id}`);
  },

  create: async (data: WebsiteRegistrationCreate): Promise<WebsiteRegistrationResponse> => {
    return request<WebsiteRegistrationResponse>("/websites/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: Partial<WebsiteRegistrationCreate>,
  ): Promise<WebsiteRegistrationResponse> => {
    return request<WebsiteRegistrationResponse>(`/websites/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return request<void>(`/websites/${id}`, {
      method: "DELETE",
    });
  },

  scan: async (id: string, params?: WebsiteScanRequest): Promise<WebsiteScanResponse> => {
    return request<WebsiteScanResponse>(`/websites/${id}/scan`, {
      method: "POST",
      body: JSON.stringify(params || {}),
    });
  },

  runDiagnostics: async (id: string, force = false): Promise<DiagnosticsRunResponse> => {
    return request<DiagnosticsRunResponse>(`/websites/${id}/scan`, {
      method: "POST",
      body: JSON.stringify({ scanType: "full", force }),
    });
  },

  getScanHistory: async (
    id: string,
    limit = 50,
  ): Promise<{ items: ScanHistoryEntry[]; total: number }> => {
    return request<{ items: ScanHistoryEntry[]; total: number }>(
      `/websites/${id}/scan-history?limit=${limit}`,
    );
  },

  getScanStatus: async (id: string, scanId: string): Promise<any> => {
    return request<any>(`/websites/${id}/scan/${scanId}`);
  },

  getSslDiagnostics: async (id: string): Promise<any> => request<any>(`/websites/${id}/ssl`),
  getHostingDiagnostics: async (id: string): Promise<any> =>
    request<any>(`/websites/${id}/hosting`),
  getPluginScans: async (id: string): Promise<PluginScanEntry[]> =>
    request<PluginScanEntry[]>(`/websites/${id}/plugin-scans`),

  getThemeScans: async (id: string): Promise<ThemeScanEntry[]> =>
    request<ThemeScanEntry[]>(`/websites/${id}/theme-scans`),

  getHealthDiagnostics: async (id: string): Promise<any> => request<any>(`/websites/${id}/health`),

  getBrokenLinks: async (id: string): Promise<any> => request<any>(`/websites/${id}/broken-links`),
  runWorkflow: async (
    id: string,
    params?: WebsiteWorkflowRequest,
  ): Promise<WebsiteWorkflowStatusResponse> => {
    return request<WebsiteWorkflowStatusResponse>(`/websites/${id}/workflow`, {
      method: "POST",
      body: JSON.stringify(params || {}),
    });
  },

  getWorkflowStatus: async (id: string): Promise<WebsiteWorkflowStatusResponse> => {
    return request<WebsiteWorkflowStatusResponse>(`/websites/${id}/workflow/status`);
  },

  // WordPress info
  getWordpressInfo: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/wordpress`);
  },

  syncWordpress: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/sync-wordpress`, {
      method: "POST",
    });
  },

  // Themes
  listThemes: async (id: string): Promise<Theme[]> => {
    return request<Theme[]>(`/websites/${id}/themes`);
  },

  uploadTheme: async (id: string, formData: FormData): Promise<ThemeInstallResponse> => {
    return request<ThemeInstallResponse>(`/websites/${id}/themes/install`, {
      method: "POST",
      body: formData,
    });
  },

  activateTheme: async (id: string, data: { slug: string }): Promise<ThemeActivateResponse> => {
    return request<ThemeActivateResponse>(`/websites/${id}/themes/activate`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteTheme: async (id: string, slug: string): Promise<ThemeDeleteResponse> => {
    return request<ThemeDeleteResponse>(`/websites/${id}/themes/${slug}`, {
      method: "DELETE",
    });
  },

  getTheme: async (id: string, slug: string): Promise<ThemeDetail> => {
    return request<ThemeDetail>(`/websites/${id}/themes/${slug}`);
  },

  updateTheme: async (id: string, data: { slug: string }): Promise<ThemeUpdateResponse> => {
    return request<ThemeUpdateResponse>(`/websites/${id}/themes/update`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Plugins
  listPlugins: async (id: string): Promise<Plugin[]> => {
    return request<Plugin[]>(`/websites/${id}/plugins`);
  },

  getPlugin: async (id: string, slug: string): Promise<PluginDetail> => {
    return request<PluginDetail>(`/websites/${id}/plugins/${slug}`);
  },

  installPluginFromRepo: async (id: string, slug: string): Promise<PluginOperationResult> => {
    return request<PluginOperationResult>(`/websites/${id}/plugins/install`, {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
  },

  uploadPlugin: async (id: string, formData: FormData): Promise<PluginOperationResult> => {
    return request<PluginOperationResult>(`/websites/${id}/plugins/upload`, {
      method: "POST",
      body: formData,
    });
  },

  activatePlugin: async (id: string, slug: string): Promise<PluginOperationResult> => {
    return request<PluginOperationResult>(`/websites/${id}/plugins/activate`, {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
  },

  deactivatePlugin: async (id: string, slug: string): Promise<PluginOperationResult> => {
    return request<PluginOperationResult>(`/websites/${id}/plugins/deactivate`, {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
  },

  deletePlugin: async (id: string, slug: string): Promise<PluginOperationResult> => {
    return request<PluginOperationResult>(`/websites/${id}/plugins/${slug}`, {
      method: "DELETE",
    });
  },

  updatePlugin: async (id: string, slug: string): Promise<PluginOperationResult> => {
    return request<PluginOperationResult>(`/websites/${id}/plugins/update`, {
      method: "POST",
      body: JSON.stringify({ slug }),
    });
  },

  rollbackPlugin: async (
    id: string,
    slug: string,
    version: string,
  ): Promise<PluginOperationResult> => {
    return request<PluginOperationResult>(`/websites/${id}/plugins/rollback`, {
      method: "POST",
      body: JSON.stringify({ slug, version }),
    });
  },

  setPluginAutoUpdate: async (
    id: string,
    slug: string,
    enabled: boolean,
  ): Promise<PluginOperationResult> => {
    return request<PluginOperationResult>(`/websites/${id}/plugins/auto-update`, {
      method: "POST",
      body: JSON.stringify({ slug, enabled }),
    });
  },

  searchPlugins: async (
    id: string,
    query: string,
    perPage = 10,
    page = 1,
  ): Promise<PluginSearchResponse> => {
    return request<PluginSearchResponse>(
      `/websites/${id}/plugins/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
    );
  },

  getPluginsHealth: async (id: string): Promise<PluginHealth> => {
    return request<PluginHealth>(`/websites/${id}/plugins/health`);
  },

  getPluginsSecurity: async (id: string): Promise<PluginSecurityIssue[]> => {
    return request<PluginSecurityIssue[]>(`/websites/${id}/plugins/security`);
  },

  getPluginLogs: async (id: string, limit = 50): Promise<PluginLog[]> => {
    return request<PluginLog[]>(`/websites/${id}/plugin-logs?limit=${limit}`);
  },

  // Forms
  listForms: async (id: string): Promise<FormManagerForm[]> => {
    const data = await request<any>(`/websites/${id}/forms`);
    return data?.forms ?? data ?? [];
  },

  getForm: async (id: string, formId: string): Promise<FormManagerForm> => {
    const data = await request<any>(`/websites/${id}/forms/${formId}`);
    return data?.data ?? data;
  },

  deleteForm: async (id: string, formId: string): Promise<FormOperationResult> => {
    return request<FormOperationResult>(`/websites/${id}/forms/${formId}`, {
      method: "DELETE",
    });
  },

  publishForm: async (id: string, formId: string): Promise<FormOperationResult> => {
    return request<FormOperationResult>(`/websites/${id}/forms/publish`, {
      method: "POST",
      body: JSON.stringify({ id: formId }),
    });
  },

  unpublishForm: async (id: string, formId: string): Promise<FormOperationResult> => {
    return request<FormOperationResult>(`/websites/${id}/forms/unpublish`, {
      method: "POST",
      body: JSON.stringify({ id: formId }),
    });
  },

  duplicateForm: async (id: string, formId: string): Promise<FormOperationResult> => {
    return request<FormOperationResult>(`/websites/${id}/forms/duplicate`, {
      method: "POST",
      body: JSON.stringify({ id: formId }),
    });
  },

  previewForm: async (id: string, formId: string): Promise<any> => {
    const result = await request<any>(`/websites/${id}/forms/preview`, {
      method: "POST",
      body: JSON.stringify({ id: formId }),
    });
    return result?.data ?? result;
  },

  getFormsHealth: async (id: string): Promise<FormManagerHealth> => {
    const result = await request<any>(`/websites/${id}/forms/health`);
    return result?.data ?? result;
  },

  getFormLogs: async (id: string, limit = 50): Promise<FormLog[]> => {
    return request<FormLog[]>(`/websites/${id}/form-logs?limit=${limit}`);
  },

  // Responsive tests
  listResponsiveTests: async (id: string): Promise<ResponsiveTest[]> => {
    return request<ResponsiveTest[]>(`/websites/${id}/responsive-tests`);
  },

  createResponsiveTest: async (id: string, data: any): Promise<ResponsiveTest> => {
    return request<ResponsiveTest>(`/websites/${id}/responsive-tests`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateResponsiveTest: async (id: string, testId: string, data: any): Promise<ResponsiveTest> => {
    return request<ResponsiveTest>(`/websites/${id}/responsive-tests/${testId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteResponsiveTest: async (id: string, testId: string): Promise<void> => {
    return request<void>(`/websites/${id}/responsive-tests/${testId}`, {
      method: "DELETE",
    });
  },

  // Core Vitals
  getCoreVitals: async (id: string): Promise<CoreVitals> => {
    return request<CoreVitals>(`/websites/${id}/core-vitals`);
  },

  createCoreVitals: async (id: string, data: any): Promise<CoreVitals> => {
    return request<CoreVitals>(`/websites/${id}/core-vitals`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateCoreVitals: async (id: string, data: any): Promise<CoreVitals> => {
    return request<CoreVitals>(`/websites/${id}/core-vitals`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Brand assets
  getBrandAsset: async (id: string): Promise<BrandAsset> => {
    return request<BrandAsset>(`/websites/${id}/brand`);
  },

  createBrandAsset: async (id: string, data: any): Promise<BrandAsset> => {
    return request<BrandAsset>(`/websites/${id}/brand`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateBrandAsset: async (id: string, data: any): Promise<BrandAsset> => {
    return request<BrandAsset>(`/websites/${id}/brand`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // AI insights
  listAiInsights: async (id: string, kind?: string): Promise<any[]> => {
    const qs = kind ? `?kind=${kind}` : "";
    return request<any[]>(`/websites/${id}/ai-insights${qs}`);
  },

  createAiInsight: async (id: string, data: any): Promise<any> => {
    return request<any>(`/websites/${id}/ai-insights`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Inventory
  getInventory: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/inventory`);
  },

  // Screenshot
  getScreenshot: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/screenshot`);
  },

  captureScreenshot: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/screenshot`, {
      method: "POST",
    });
  },

  // SEO
  getSeo: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/seo`);
  },

  // Performance
  getPerformance: async (id: string): Promise<WebsitePerformance> => {
    return request<WebsitePerformance>(`/websites/${id}/performance`);
  },

  // Robots.txt
  getRobots: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/robots`);
  },

  // Responsive
  getResponsive: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/responsive`);
  },

  // Sitemap
  getSitemap: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/sitemap`);
  },

  // Security
  getSecurity: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/security`);
  },

  // WordPress settings
  getSettings: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/settings`);
  },

  // Categories
  getCategories: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/categories`);
  },

  // Tags
  getTags: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/tags`);
  },

  // Post types
  getTypes: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/types`);
  },

  // Shortcodes
  getShortcodes: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/shortcodes`);
  },

  // Brand assets
  getBrandAssets: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/brand-assets`);
  },

  // Consolidated dashboard
  getDashboard: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/dashboard`);
  },
};
