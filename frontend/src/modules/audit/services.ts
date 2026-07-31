import type {
  AuditRun,
  TechnicalIssue,
  AuditFinding,
  BlackHatDetection,
  GreyHatDetection,
  AuditExportResult,
  PaginatedResponse,
} from "@/modules/audit/types";

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

export const auditApi = {
  createRun: (data: { audit_type: string; audit_name: string; foundation_project_id?: string }) =>
    request<AuditRun>("/audits/runs", { method: "POST", body: JSON.stringify(data) }),

  listRuns: (params?: {
    foundation_project_id?: string;
    status?: string;
    audit_type?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.status) qs.set("status", params.status);
    if (params?.audit_type) qs.set("audit_type", params.audit_type);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: AuditRun[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/audits/runs${query ? `?${query}` : ""}`
    );
  },

  getRun: (runId: string) =>
    request<AuditRun>(`/audits/runs/${runId}`),

  updateRun: (runId: string, data: Partial<AuditRun>) =>
    request<AuditRun>(`/audits/runs/${runId}`, { method: "PUT", body: JSON.stringify(data) }),

  listIssues: (runId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: TechnicalIssue[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/audits/runs/${runId}/issues${query ? `?${query}` : ""}`
    );
  },

  listFindings: (runId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: AuditFinding[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/audits/runs/${runId}/findings${query ? `?${query}` : ""}`
    );
  },

  listBlackHat: (runId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: BlackHatDetection[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/audits/runs/${runId}/black-hat${query ? `?${query}` : ""}`
    );
  },

  listGreyHat: (runId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: GreyHatDetection[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/audits/runs/${runId}/grey-hat${query ? `?${query}` : ""}`
    );
  },

  addBlackHat: (runId: string, data: { technique: string; technique_category: string; severity: string; url?: string; description?: string; evidence?: string; impact?: string; recommendation?: string }) =>
    request<BlackHatDetection>(`/audits/runs/${runId}/black-hat`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addGreyHat: (runId: string, data: { technique: string; technique_category: string; severity: string; url?: string; description?: string; evidence?: string; risk_assessment?: string; recommendation?: string }) =>
    request<GreyHatDetection>(`/audits/runs/${runId}/grey-hat`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteRun: (runId: string) =>
    request<void>(`/audits/runs/${runId}`, { method: "DELETE" }),
  exportAudit: (runId: string, data?: { format?: string; include_findings?: boolean; include_recommendations?: boolean }) =>
    request<AuditExportResult>(`/audits/runs/${runId}/export`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
};
