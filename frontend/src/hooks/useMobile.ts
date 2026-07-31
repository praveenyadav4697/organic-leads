import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mobileApi } from "@/modules/mobile/services";
import type {
  MobileTest,
  TouchTargetIssue,
  ViewportIssue,
  MobileFormIssue,
  MobileEvent,
} from "@/modules/mobile/types";

export function useMobileTests(params?: {
  foundation_project_id?: string;
  device_type?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: MobileTest[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["mobile-tests", params],
    queryFn: () => mobileApi.listTests(params),
  });
}

export function useMobileTest(testId: string | null) {
  return useQuery<MobileTest>({
    queryKey: ["mobile-test", testId],
    queryFn: () => mobileApi.getTest(testId!),
    enabled: !!testId,
  });
}

export function useCreateMobileTest() {
  const queryClient = useQueryClient();
  return useMutation<MobileTest, Error, { url: string; device_type: string; foundation_project_id?: string }>({
    mutationFn: mobileApi.createTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-tests"] });
    },
  });
}

export function useUpdateMobileTest() {
  const queryClient = useQueryClient();
  return useMutation<MobileTest, Error, { id: string; data: Partial<MobileTest> }>({
    mutationFn: ({ id, data }) => mobileApi.updateTest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-tests"] });
    },
  });
}

export function useDeleteMobileTest() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: mobileApi.deleteTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-tests"] });
    },
  });
}

export function useTouchTargets(testId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: TouchTargetIssue[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["touch-targets", testId, params],
    queryFn: () => mobileApi.listTouchTargets(testId, params),
    enabled: !!testId,
  });
}

export function useAddTouchTarget() {
  const queryClient = useQueryClient();
  return useMutation<TouchTargetIssue, Error, { testId: string; data: { element_selector?: string; element_text?: string; target_size_width?: number; target_size_height?: number; min_target_size?: number; gap_to_adjacent?: number; status?: string; recommendation?: string } }>({
    mutationFn: ({ testId, data }) => mobileApi.addTouchTarget(testId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["touch-targets"] });
    },
  });
}

export function useViewportIssues(testId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: ViewportIssue[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["viewport-issues", testId, params],
    queryFn: () => mobileApi.listViewportIssues(testId, params),
    enabled: !!testId,
  });
}

export function useAddViewportIssue() {
  const queryClient = useQueryClient();
  return useMutation<ViewportIssue, Error, { testId: string; data: { url: string; issue_type: string; description?: string; viewport_width?: number; viewport_height?: number; viewport_scale?: number; status?: string } }>({
    mutationFn: ({ testId, data }) => mobileApi.addViewportIssue(testId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewport-issues"] });
    },
  });
}

export function useFormIssues(testId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: MobileFormIssue[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["form-issues", testId, params],
    queryFn: () => mobileApi.listFormIssues(testId, params),
    enabled: !!testId,
  });
}

export function useAddFormIssue() {
  const queryClient = useQueryClient();
  return useMutation<MobileFormIssue, Error, { testId: string; data: { form_selector?: string; field_label?: string; field_type?: string; issue_type: string; description?: string; status?: string } }>({
    mutationFn: ({ testId, data }) => mobileApi.addFormIssue(testId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["form-issues"] });
    },
  });
}

export function useMobileEvents(testId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: MobileEvent[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["mobile-events", testId, params],
    queryFn: () => mobileApi.listEvents(testId, params),
    enabled: !!testId,
  });
}

export function useAddMobileEvent() {
  const queryClient = useQueryClient();
  return useMutation<MobileEvent, Error, { testId: string; data: { event_type: string; event_name?: string; element_selector?: string; tracked?: boolean; issue?: string } }>({
    mutationFn: ({ testId, data }) => mobileApi.addEvent(testId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-events"] });
    },
  });
}