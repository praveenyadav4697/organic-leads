import type {
  TrackingConfig,
  TrackingIntegration,
  TrackingEvent,
  TrackingVerification,
  MeasurementPlan,
  ContactForm,
  FormField,
  FormSubmission,
  SubmissionAttachment,
  UTMRecord,
  ConsentVersion,
  ConsentLog,
  DeliveryLog,
  RetryLog,
  ApprovalRequest,
  TrackingDashboardStats,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
    const message = body.detail || res.statusText || "An error occurred";
    throw new Error(message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const trackingApi = {
  configs: {
    list: async (params?: {
      websiteId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: TrackingConfig[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.websiteId) qs.set("website_id", params.websiteId);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/configs${query ? `?${query}` : ""}`);
    },
    get: async (id: string): Promise<TrackingConfig> => {
      return request<TrackingConfig>(`/tracking/configs/${id}`);
    },
    create: async (data: Partial<TrackingConfig>): Promise<TrackingConfig> => {
      return request<TrackingConfig>("/tracking/configs", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<TrackingConfig>): Promise<TrackingConfig> => {
      return request<TrackingConfig>(`/tracking/configs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      return request<void>(`/tracking/configs/${id}`, { method: "DELETE" });
    },
  },

  integrations: {
    list: async (params?: {
      trackingConfigId?: string;
      provider?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: TrackingIntegration[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.trackingConfigId) qs.set("tracking_config_id", params.trackingConfigId);
      if (params?.provider) qs.set("provider", params.provider);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/integrations${query ? `?${query}` : ""}`);
    },
    get: async (id: string): Promise<TrackingIntegration> => {
      return request<TrackingIntegration>(`/tracking/integrations/${id}`);
    },
    create: async (data: Partial<TrackingIntegration>): Promise<TrackingIntegration> => {
      return request<TrackingIntegration>("/tracking/integrations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<TrackingIntegration>): Promise<TrackingIntegration> => {
      return request<TrackingIntegration>(`/tracking/integrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      return request<void>(`/tracking/integrations/${id}`, { method: "DELETE" });
    },
    verify: async (id: string, verificationType: string): Promise<TrackingVerification> => {
      return request<TrackingVerification>("/tracking/verifications", {
        method: "POST",
        body: JSON.stringify({
          integration_id: id,
          verification_type: verificationType,
          status: "pending",
          correlation_id: `ver_${Date.now()}`,
        }),
      });
    },
  },

  events: {
    list: async (params?: {
      trackingConfigId?: string;
      eventType?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: TrackingEvent[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.trackingConfigId) qs.set("tracking_config_id", params.trackingConfigId);
      if (params?.eventType) qs.set("event_type", params.eventType);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/events${query ? `?${query}` : ""}`);
    },
    get: async (id: string): Promise<TrackingEvent> => {
      return request<TrackingEvent>(`/tracking/events/${id}`);
    },
    create: async (data: Partial<TrackingEvent>): Promise<TrackingEvent> => {
      return request<TrackingEvent>("/tracking/events", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<TrackingEvent>): Promise<TrackingEvent> => {
      return request<TrackingEvent>(`/tracking/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      return request<void>(`/tracking/events/${id}`, { method: "DELETE" });
    },
  },

  measurementPlans: {
    list: async (params?: {
      websiteId?: string;
      status?: string;
      approvalStatus?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: MeasurementPlan[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.websiteId) qs.set("website_id", params.websiteId);
      if (params?.status) qs.set("status", params.status);
      if (params?.approvalStatus) qs.set("approval_status", params.approvalStatus);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/measurement-plans${query ? `?${query}` : ""}`);
    },
    get: async (id: string): Promise<MeasurementPlan> => {
      return request<MeasurementPlan>(`/tracking/measurement-plans/${id}`);
    },
    create: async (data: Partial<MeasurementPlan>): Promise<MeasurementPlan> => {
      return request<MeasurementPlan>("/tracking/measurement-plans", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<MeasurementPlan>): Promise<MeasurementPlan> => {
      return request<MeasurementPlan>(`/tracking/measurement-plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      return request<void>(`/tracking/measurement-plans/${id}`, { method: "DELETE" });
    },
  },

  contactForms: {
    list: async (params?: {
      trackingConfigId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: ContactForm[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.trackingConfigId) qs.set("tracking_config_id", params.trackingConfigId);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/contact-forms${query ? `?${query}` : ""}`);
    },
    get: async (id: string): Promise<ContactForm> => {
      return request<ContactForm>(`/tracking/contact-forms/${id}`);
    },
    create: async (data: Partial<ContactForm>): Promise<ContactForm> => {
      return request<ContactForm>("/tracking/contact-forms", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<ContactForm>): Promise<ContactForm> => {
      return request<ContactForm>(`/tracking/contact-forms/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      return request<void>(`/tracking/contact-forms/${id}`, { method: "DELETE" });
    },
  },

  formFields: {
    list: async (formId: string): Promise<FormField[]> => {
      return request<FormField[]>(`/tracking/contact-forms/${formId}/fields`);
    },
    create: async (formId: string, data: Partial<FormField>): Promise<FormField> => {
      return request<FormField>(`/tracking/contact-forms/${formId}/fields`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<FormField>): Promise<FormField> => {
      return request<FormField>(`/tracking/fields/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string): Promise<void> => {
      return request<void>(`/tracking/fields/${id}`, { method: "DELETE" });
    },
  },

  submissions: {
    list: async (params?: {
      contactFormId?: string;
      trackingConfigId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: FormSubmission[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.contactFormId) qs.set("contact_form_id", params.contactFormId);
      if (params?.trackingConfigId) qs.set("tracking_config_id", params.trackingConfigId);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/submissions${query ? `?${query}` : ""}`);
    },
    get: async (id: string): Promise<FormSubmission> => {
      return request<FormSubmission>(`/tracking/submissions/${id}`);
    },
    create: async (data: Partial<FormSubmission>): Promise<FormSubmission> => {
      return request<FormSubmission>("/tracking/submissions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  deliveryLogs: {
    list: async (params?: {
      submissionId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: DeliveryLog[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.submissionId) qs.set("submission_id", params.submissionId);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/delivery-logs${query ? `?${query}` : ""}`);
    },
  },

  retryLogs: {
    list: async (params?: {
      submissionId?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: RetryLog[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.submissionId) qs.set("submission_id", params.submissionId);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/retry-logs${query ? `?${query}` : ""}`);
    },
  },

  consentLogs: {
    list: async (params?: {
      trackingConfigId?: string;
      action?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: ConsentLog[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.trackingConfigId) qs.set("tracking_config_id", params.trackingConfigId);
      if (params?.action) qs.set("action", params.action);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/consent-logs${query ? `?${query}` : ""}`);
    },
  },

  approvalRequests: {
    list: async (params?: {
      trackingConfigId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: ApprovalRequest[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.trackingConfigId) qs.set("tracking_config_id", params.trackingConfigId);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/approvals${query ? `?${query}` : ""}`);
    },
    get: async (id: string): Promise<ApprovalRequest> => {
      return request<ApprovalRequest>(`/tracking/approvals/${id}`);
    },
    create: async (data: Partial<ApprovalRequest>): Promise<ApprovalRequest> => {
      return request<ApprovalRequest>("/tracking/approvals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Partial<ApprovalRequest>): Promise<ApprovalRequest> => {
      return request<ApprovalRequest>(`/tracking/approvals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  },

  verifications: {
    list: async (params?: {
      trackingConfigId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }): Promise<{ items: TrackingVerification[]; total: number; page: number; pageSize: number; totalPages: number }> => {
      const qs = new URLSearchParams();
      if (params?.trackingConfigId) qs.set("tracking_config_id", params.trackingConfigId);
      if (params?.status) qs.set("status", params.status);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.pageSize) qs.set("page_size", String(params.pageSize));
      const query = qs.toString();
      return request(`/tracking/verifications${query ? `?${query}` : ""}`);
    },
  },

  dashboard: {
    getStats: async (): Promise<TrackingDashboardStats> => {
      return request<TrackingDashboardStats>("/tracking/dashboard/stats");
    },
  },
};