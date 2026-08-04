import type {
  TrackingScript,
  ConsentConfiguration,
  ConsentDetails,
  FormValidation,
  SubmissionDestination,
  EventTest,
  TrackingAuditLog,
  DashboardStats,
  TrackingProvider,
  TrackingStatus,
  VerificationStatus,
  HealthStatus,
  ConsentStatus,
  DeliveryStatus,
  EventType,
  SpamProtectionInfo,
  TrackingProviderInfo,
  TrackingScriptDiscovery,
  VerificationProvider,
  TrackingScriptVerifyResponse,
  MeasurementPlan,
  FormSubmission,
  FormSubmissionSummaryResponse,
} from "./types";

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
    const message = body.message || body.detail || res.statusText || "An error occurred";
    throw new Error(message);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export const trackingApi = {
  scripts: {
    list: async (websiteId: string): Promise<any[]> => {
      const data = await request<any[]>(`/tracking/${websiteId}/scripts`);
      return Array.isArray(data) ? data : [];
    },
    verify: async (websiteId: string, scriptId: string, force = false): Promise<any> => {
      return request(`/tracking/${websiteId}/scripts/${scriptId}/verify`, {
        method: "POST",
        body: JSON.stringify({ force }),
      });
    },
    discovery: async (websiteId: string): Promise<any> => {
      return request(`/tracking/${websiteId}/tracking-scripts/discovery`);
    },
    verifyAll: async (websiteId: string): Promise<any> => {
      return request(`/tracking/${websiteId}/tracking-scripts/verify`);
    },
  },
  forms: {
    list: async (websiteId: string): Promise<any[]> => {
      const data = await request<any>(`/tracking/${websiteId}/forms`);
      return data?.items || data || [];
    },
    validate: async (websiteId: string, formId: string, force = false): Promise<any> => {
      return request(`/tracking/${websiteId}/forms/${formId}/validate`, {
        method: "POST",
        body: JSON.stringify({ force }),
      });
    },
    test: async (websiteId: string, formId: string, destinationType = "email", testData?: Record<string, unknown>): Promise<any> => {
      return request(`/tracking/${websiteId}/forms/${formId}/test`, {
        method: "POST",
        body: JSON.stringify({ destination_type: destinationType, test_data: testData }),
      });
    },
    fields: async (websiteId: string, formId: string): Promise<any> => {
      return request(`/tracking/${websiteId}/forms/${formId}/fields`);
    },
    destinations: async (websiteId: string, formId: string): Promise<any> => {
      return request(`/tracking/${websiteId}/forms/${formId}/destinations`);
    },
    submissions: async (websiteId: string, formId: string, status?: string, page = 1, pageSize = 50): Promise<any> => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (status) params.set("status", status);
      return request(`/tracking/${websiteId}/forms/${formId}/submissions?${params.toString()}`);
    },
  },
  consent: {
    get: async (websiteId: string): Promise<ConsentConfiguration> => {
      return request<ConsentConfiguration>(`/tracking/${websiteId}/consent`);
    },
    getDetails: async (websiteId: string): Promise<ConsentDetails> => {
      return request<ConsentDetails>(`/tracking/${websiteId}/consent/details`);
    },
    verify: async (websiteId: string, force = false): Promise<any> => {
      return request(`/tracking/${websiteId}/consent/verify`, {
        method: "POST",
        body: JSON.stringify({ force }),
      });
    },
  },
  routing: {
    list: async (websiteId: string): Promise<any[]> => {
      const data = await request<any>(`/tracking/${websiteId}/routing`);
      return data?.items || data || [];
    },
    verify: async (websiteId: string, destinationId: string, force = false): Promise<any> => {
      return request(`/tracking/${websiteId}/routing/${destinationId}/verify`, {
        method: "POST",
        body: JSON.stringify({ force }),
      });
    },
  },
  events: {
    test: async (websiteId: string, eventType: string, eventName: string, destination?: string, testData?: Record<string, unknown>): Promise<any> => {
      return request(`/tracking/${websiteId}/events/test`, {
        method: "POST",
        body: JSON.stringify({ event_type: eventType, event_name: eventName, destination, test_data: testData }),
      });
    },
  },
  submissions: {
    list: async (websiteId: string, status?: string, page = 1, pageSize = 50): Promise<{ items: FormSubmission[]; total: number }> => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      if (status) params.set("status", status);
      return request<{ items: FormSubmission[]; total: number }>(`/tracking/${websiteId}/submissions?${params.toString()}`);
    },
    summary: async (websiteId: string): Promise<FormSubmissionSummaryResponse> => {
      return request<FormSubmissionSummaryResponse>(`/tracking/${websiteId}/submissions/summary`);
    },
  },
  verification: {
    list: async (websiteId: string): Promise<{
      providers: VerificationProvider[];
      scripts: TrackingScriptDiscovery[];
      synced_at: string | null;
    }> => {
      return request(`/tracking/${websiteId}/tracking-scripts/verify`);
    },
  },
  scan: {
    run: async (websiteId: string, force = false): Promise<any> => {
      return request(`/tracking/${websiteId}/scan`, {
        method: "POST",
        body: JSON.stringify({ force }),
      });
    },
  },
  dashboard: {
    getStats: async (websiteId: string): Promise<DashboardStats> => {
      return request<DashboardStats>(`/tracking/${websiteId}/dashboard`);
    },
  },
  spamProtection: {
    get: async (websiteId: string): Promise<any> => {
      return request(`/tracking/${websiteId}/spam-protection`);
    },
  },
  measurementPlans: {
    list: async (websiteId: string, page = 1, pageSize = 50): Promise<any> => {
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
      return request(`/tracking/${websiteId}/measurement-plans?${params.toString()}`);
    },
    create: async (websiteId: string, data: Partial<MeasurementPlan>): Promise<any> => {
      return request(`/tracking/${websiteId}/measurement-plans`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    get: async (websiteId: string, planId: string): Promise<any> => {
      return request(`/tracking/${websiteId}/measurement-plans/${planId}`);
    },
    update: async (websiteId: string, planId: string, data: Partial<MeasurementPlan>): Promise<any> => {
      return request(`/tracking/${websiteId}/measurement-plans/${planId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    delete: async (websiteId: string, planId: string): Promise<any> => {
      return request(`/tracking/${websiteId}/measurement-plans/${planId}`, {
        method: "DELETE",
      });
    },
  },
};
