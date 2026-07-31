import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { performanceApi } from "@/modules/performance/services";
import type {
  PerformanceCheck,
  PageSpeedInsight,
  ServerHeader,
  Error404Page,
  AssetFile,
  FontAsset,
} from "@/modules/performance/types";

export function usePerformanceChecks(params?: {
  foundation_project_id?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: PerformanceCheck[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["performance-checks", params],
    queryFn: () => performanceApi.listChecks(params),
  });
}

export function usePerformanceCheck(checkId: string | null) {
  return useQuery<PerformanceCheck>({
    queryKey: ["performance-check", checkId],
    queryFn: () => performanceApi.getCheck(checkId!),
    enabled: !!checkId,
  });
}

export function useCreatePerformanceCheck() {
  const queryClient = useQueryClient();
  return useMutation<PerformanceCheck, Error, { url: string; foundation_project_id?: string }>({
    mutationFn: performanceApi.createCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-checks"] });
    },
  });
}

export function useUpdatePerformanceCheck() {
  const queryClient = useQueryClient();
  return useMutation<PerformanceCheck, Error, { id: string; data: Partial<PerformanceCheck> }>({
    mutationFn: ({ id, data }) => performanceApi.updateCheck(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-checks"] });
    },
  });
}

export function useDeletePerformanceCheck() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: performanceApi.deleteCheck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-checks"] });
    },
  });
}

export function usePageSpeedInsights(params?: {
  foundation_project_id?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: PageSpeedInsight[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["pagespeed-insights", params],
    queryFn: () => performanceApi.listPageSpeed(params),
  });
}

export function useRunPageSpeed() {
  const queryClient = useQueryClient();
  return useMutation<PageSpeedInsight, Error, { url: string; strategy?: string }>({
    mutationFn: performanceApi.runPageSpeed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagespeed-insights"] });
    },
  });
}

export function useServerHeaders(params?: {
  foundation_project_id?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: ServerHeader[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["server-headers", params],
    queryFn: () => performanceApi.listServerHeaders(params),
  });
}

export function useCreateServerHeader() {
  const queryClient = useQueryClient();
  return useMutation<ServerHeader, Error, { url: string; header_name: string; header_value?: string; is_security_header?: boolean; foundation_project_id?: string }>({
    mutationFn: performanceApi.createServerHeader,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["server-headers"] });
    },
  });
}

export function use404Errors(params?: {
  foundation_project_id?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: Error404Page[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["404-errors", params],
    queryFn: () => performanceApi.list404Errors(params),
  });
}

export function useResolve404() {
  const queryClient = useQueryClient();
  return useMutation<Error404Page, Error, { errorId: string; resolutionUrl: string; resolutionType?: string }>({
    mutationFn: ({ errorId, resolutionUrl, resolutionType }) =>
      performanceApi.resolve404(errorId, resolutionUrl, resolutionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["404-errors"] });
    },
  });
}

export function useAssets(params?: {
  foundation_project_id?: string;
  asset_type?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: AssetFile[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["assets", params],
    queryFn: () => performanceApi.listAssets(params),
  });
}

export function useAddAsset() {
  const queryClient = useQueryClient();
  return useMutation<AssetFile, Error, { url: string; asset_type: string; file_size_bytes?: number; foundation_project_id?: string }>({
    mutationFn: performanceApi.addAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });
}

export function useFonts(params?: {
  foundation_project_id?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: FontAsset[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["fonts", params],
    queryFn: () => performanceApi.listFonts(params),
  });
}

export function useAddFont() {
  const queryClient = useQueryClient();
  return useMutation<FontAsset, Error, { url: string; font_family?: string; font_weight?: string; font_style?: string; format?: string; file_size_bytes?: number; subset?: string; is_self_hosted?: boolean; foundation_project_id?: string }>({
    mutationFn: performanceApi.addFont,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fonts"] });
    },
  });
}