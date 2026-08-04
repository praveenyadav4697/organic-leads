import { apiClient } from "@/lib/api-client";

export interface FormSubmission {
  id: string;
  website_id: string;
  form_id: string;
  form_name: string;
  plugin: string;
  visitor_ip?: string;
  submission_data?: Record<string, any>;
  destination_type?: string;
  destination_address?: string;
  status: "pending" | "sent" | "delivered" | "failed" | "spamming";
  delivery_status?: string;
  error_message?: string;
  submitted_at: string;
  created_at: string;
}

export interface FormSubmissionListResponse {
  items: FormSubmission[];
  total: number;
}

export interface TrackingDashboardStats {
  total_scripts: number;
  active_scripts: number;
  scripts_with_errors: number;
  total_forms: number;
  total_submissions: number;
  failed_deliveries: number;
}

export const trackingApi = {
  getSubmissions: async (
    websiteId?: string,
    params?: {
      form_id?: string;
      status?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<FormSubmissionListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.form_id) queryParams.append("form_id", params.form_id);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.page_size) queryParams.append("page_size", params.page_size.toString());

    const url = websiteId
      ? `/api/v1/tracking/${websiteId}/submissions?${queryParams}`
      : `/api/v1/tracking/submissions?${queryParams}`;

    const response = await apiClient.get<FormSubmissionListResponse>(url);
    return response;
  },

  getSubmissionsSummary: async (websiteId?: string): Promise<any> => {
    const url = websiteId
      ? `/api/v1/tracking/${websiteId}/submissions/summary`
      : `/api/v1/tracking/submissions/summary`;

    const response = await apiClient.get<any>(url);
    return response;
  },

  getDashboardStats: async (websiteId?: string): Promise<TrackingDashboardStats> => {
    const url = websiteId
      ? `/api/v1/tracking/${websiteId}/dashboard`
      : `/api/v1/tracking/dashboard`;

    const response = await apiClient.get<TrackingDashboardStats>(url);
    return response;
  },
};
