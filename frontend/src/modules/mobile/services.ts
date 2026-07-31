import type {
  MobileTest,
  TouchTargetIssue,
  ViewportIssue,
  MobileFormIssue,
  MobileEvent,
} from "@/modules/mobile/types";

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

export const mobileApi = {
  listTests: (params?: {
    foundation_project_id?: string;
    device_type?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.foundation_project_id) qs.set("foundation_project_id", params.foundation_project_id);
    if (params?.device_type) qs.set("device_type", params.device_type);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: MobileTest[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/mobile/tests${query ? `?${query}` : ""}`
    );
  },

  createTest: (data: { url: string; device_type: string; foundation_project_id?: string }) =>
    request<MobileTest>("/mobile/tests", { method: "POST", body: JSON.stringify(data) }),

  getTest: (testId: string) =>
    request<MobileTest>(`/mobile/tests/${testId}`),

  updateTest: (testId: string, data: Partial<MobileTest>) =>
    request<MobileTest>(`/mobile/tests/${testId}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteTest: (testId: string) =>
    request<void>(`/mobile/tests/${testId}`, { method: "DELETE" }),

  listTouchTargets: (testId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: TouchTargetIssue[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/mobile/tests/${testId}/touch-targets${query ? `?${query}` : ""}`
    );
  },

  addTouchTarget: (testId: string, data: { element_selector?: string; element_text?: string; target_size_width?: number; target_size_height?: number; min_target_size?: number; gap_to_adjacent?: number; status?: string; recommendation?: string }) =>
    request<TouchTargetIssue>(`/mobile/tests/${testId}/touch-targets`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listViewportIssues: (testId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: ViewportIssue[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/mobile/tests/${testId}/viewport-issues${query ? `?${query}` : ""}`
    );
  },

  addViewportIssue: (testId: string, data: { url: string; issue_type: string; description?: string; viewport_width?: number; viewport_height?: number; viewport_scale?: number; status?: string }) =>
    request<ViewportIssue>(`/mobile/tests/${testId}/viewport-issues`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listFormIssues: (testId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: MobileFormIssue[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/mobile/tests/${testId}/form-issues${query ? `?${query}` : ""}`
    );
  },

  addFormIssue: (testId: string, data: { form_selector?: string; field_label?: string; field_type?: string; issue_type: string; description?: string; status?: string }) =>
    request<MobileFormIssue>(`/mobile/tests/${testId}/form-issues`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listEvents: (testId: string, params?: { page?: number; page_size?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.page_size) qs.set("page_size", String(params.page_size));
    const query = qs.toString();
    return request<{ items: MobileEvent[]; total: number; page: number; page_size: number; total_pages: number }>(
      `/mobile/tests/${testId}/events${query ? `?${query}` : ""}`
    );
  },

  addEvent: (testId: string, data: { event_type: string; event_name?: string; element_selector?: string; tracked?: boolean; issue?: string }) =>
    request<MobileEvent>(`/mobile/tests/${testId}/events`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};