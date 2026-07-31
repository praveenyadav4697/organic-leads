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
} from "@/types/website";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const hasBody = options.body !== undefined && options.body !== null;
  const res = await fetch(url, {
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.detail || res.statusText || "An error occurred";
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
  }): Promise<{ items: WebsiteRegistrationResponse[]; total: number; page: number; page_size: number; total_pages: number }> => {
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
      page_size: response?.page_size ?? (Array.isArray(response?.items) ? response.items.length : 0),
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

  update: async (id: string, data: Partial<WebsiteRegistrationCreate>): Promise<WebsiteRegistrationResponse> => {
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

  getScanHistory: async (id: string, limit = 50): Promise<{ items: ScanHistoryEntry[]; total: number }> => {
    return request<{ items: ScanHistoryEntry[]; total: number }>(`/websites/${id}/scan-history?limit=${limit}`);
  },

  getScanStatus: async (id: string, scanId: string): Promise<any> => {
    return request<any>(`/websites/${id}/scan/${scanId}`);
  },

  getSslDiagnostics: async (id: string): Promise<any> => request<any>(`/websites/${id}/ssl`),
  getHostingDiagnostics: async (id: string): Promise<any> => request<any>(`/websites/${id}/hosting`),
  getPluginScans: async (id: string): Promise<PluginScanEntry[]> => request<PluginScanEntry[]>(`/websites/${id}/plugin-scans`),

  getThemeScans: async (id: string): Promise<ThemeScanEntry[]> => request<ThemeScanEntry[]>(`/websites/${id}/theme-scans`),

  getHealthDiagnostics: async (id: string): Promise<any> => request<any>(`/websites/${id}/health`),

  getBrokenLinks: async (id: string): Promise<any> => request<any>(`/websites/${id}/broken-links`),
  runWorkflow: async (id: string, params?: WebsiteWorkflowRequest): Promise<WebsiteWorkflowStatusResponse> => {
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

  createTheme: async (id: string, data: any): Promise<Theme> => {
    return request<Theme>(`/websites/${id}/themes`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTheme: async (id: string, themeId: string, data: any): Promise<Theme> => {
    return request<Theme>(`/websites/${id}/themes/${themeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteTheme: async (id: string, themeId: string): Promise<void> => {
    return request<void>(`/websites/${id}/themes/${themeId}`, {
      method: "DELETE",
    });
  },

  // Plugins
  listPlugins: async (id: string): Promise<Plugin[]> => {
    return request<Plugin[]>(`/websites/${id}/plugins`);
  },

  createPlugin: async (id: string, data: any): Promise<Plugin> => {
    return request<Plugin>(`/websites/${id}/plugins`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updatePlugin: async (id: string, pluginId: string, data: any): Promise<Plugin> => {
    return request<Plugin>(`/websites/${id}/plugins/${pluginId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deletePlugin: async (id: string, pluginId: string): Promise<void> => {
    return request<void>(`/websites/${id}/plugins/${pluginId}`, {
      method: "DELETE",
    });
  },

  // Forms
  listForms: async (id: string): Promise<Form[]> => {
    return request<Form[]>(`/websites/${id}/forms`);
  },

  createForm: async (id: string, data: any): Promise<Form> => {
    return request<Form>(`/websites/${id}/forms`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateForm: async (id: string, formId: string, data: any): Promise<Form> => {
    return request<Form>(`/websites/${id}/forms/${formId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteForm: async (id: string, formId: string): Promise<void> => {
    return request<void>(`/websites/${id}/forms/${formId}`, {
      method: "DELETE",
    });
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

  // Backlog issues
  listBacklogIssues: async (id: string, params?: { page?: number; page_size?: number; status?: string; priority?: string }): Promise<any> => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    if (params?.status) qs.set("status", params.status);
    if (params?.priority) qs.set("priority", params.priority);
    const query = qs.toString();
    return request<any>(`/websites/${id}/backlog${query ? `?${query}` : ""}`);
  },

  createBacklogIssue: async (id: string, data: any): Promise<any> => {
    return request<any>(`/websites/${id}/backlog`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateBacklogIssue: async (id: string, issueId: string, data: any): Promise<any> => {
    return request<any>(`/websites/${id}/backlog/${issueId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteBacklogIssue: async (id: string, issueId: string): Promise<void> => {
    return request<void>(`/websites/${id}/backlog/${issueId}`, {
      method: "DELETE",
    });
  },

  // Rollback entries
  listRollbacks: async (id: string): Promise<RollbackEntry[]> => {
    return request<RollbackEntry[]>(`/websites/${id}/rollbacks`);
  },

  createRollback: async (id: string, data: any): Promise<RollbackEntry> => {
    return request<RollbackEntry>(`/websites/${id}/rollbacks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // Deployments
  listDeployments: async (id: string): Promise<Deployment[]> => {
    return request<Deployment[]>(`/websites/${id}/deployments`);
  },

  createDeployment: async (id: string, data: any): Promise<Deployment> => {
    return request<Deployment>(`/websites/${id}/deployments`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateDeployment: async (id: string, deploymentId: string, data: any): Promise<Deployment> => {
    return request<Deployment>(`/websites/${id}/deployments/${deploymentId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Approvals
  listApprovals: async (id: string): Promise<Approval[]> => {
    return request<Approval[]>(`/websites/${id}/approvals`);
  },

  createApproval: async (id: string, data: any): Promise<Approval> => {
    return request<Approval>(`/websites/${id}/approvals`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateApproval: async (id: string, approvalId: string, data: any): Promise<Approval> => {
    return request<Approval>(`/websites/${id}/approvals/${approvalId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Automation jobs
  listJobs: async (id: string): Promise<AutomationJob[]> => {
    return request<AutomationJob[]>(`/websites/${id}/jobs`);
  },

  createJob: async (id: string, data: any): Promise<AutomationJob> => {
    return request<AutomationJob>(`/websites/${id}/jobs`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateJob: async (id: string, jobId: string, data: any): Promise<AutomationJob> => {
    return request<AutomationJob>(`/websites/${id}/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Log entries
  listLogs: async (id: string, limit?: number): Promise<LogEntry[]> => {
    const qs = limit ? `?limit=${limit}` : "";
    return request<LogEntry[]>(`/websites/${id}/logs${qs}`);
  },

  createLog: async (id: string, data: any): Promise<LogEntry> => {
    return request<LogEntry>(`/websites/${id}/logs`, {
      method: "POST",
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
  getPerformance: async (id: string): Promise<any> => {
    return request<any>(`/websites/${id}/performance`);
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
};
