import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { websiteApi } from "@/api/websiteApi";
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

export function useWebsites(params?: {
  page?: number;
  page_size?: number;
  environment?: string;
}) {
  return useQuery<{
    items: WebsiteRegistrationResponse[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["websites", params],
    queryFn: () => websiteApi.list(params),
  });
}

export function useWebsite(id: string) {
  return useQuery<WebsiteRegistrationResponse>({
    queryKey: ["website", id],
    queryFn: () => websiteApi.get(id),
    enabled: !!id,
  });
}

export function useCreateWebsite() {
  const queryClient = useQueryClient();
  return useMutation<WebsiteRegistrationResponse, Error, WebsiteRegistrationCreate>(
    {
      mutationFn: websiteApi.create,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["websites"] });
      },
    }
  );
}

export function useUpdateWebsite() {
  const queryClient = useQueryClient();
  return useMutation<
    WebsiteRegistrationResponse,
    Error,
    { id: string; data: Partial<WebsiteRegistrationCreate> }
  >({
    mutationFn: ({ id, data }) => websiteApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["website", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
  });
}

export function useDeleteWebsite() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: websiteApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
  });
}

export function useScanWebsite() {
  const queryClient = useQueryClient();
  return useMutation<
    WebsiteScanResponse,
    Error,
    { id: string; params?: WebsiteScanRequest }
  >({
    mutationFn: ({ id, params }) => websiteApi.scan(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["website", variables.id] });
    },
  });
}

export function useRunWebsiteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation<
    WebsiteWorkflowStatusResponse,
    Error,
    { id: string; params?: WebsiteWorkflowRequest }
  >({
    mutationFn: ({ id, params }) => websiteApi.runWorkflow(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["website", variables.id] });
    },
  });
}

export function useWorkflowStatus(id: string) {
  return useQuery<WebsiteWorkflowStatusResponse>({
    queryKey: ["website-workflow", id],
    queryFn: () => websiteApi.getWorkflowStatus(id),
    enabled: !!id,
    refetchInterval: 5000,
  });
}

export function useRunDiagnostics() {
  const queryClient = useQueryClient();
  return useMutation<DiagnosticsRunResponse, Error, { id: string; force?: boolean }>({
    mutationFn: ({ id, force }) => websiteApi.runDiagnostics(id, force),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["website-diagnostics", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["website", variables.id] });
    },
  });
}

export function useScanHistory(id: string, limit = 50) {
  return useQuery<{ items: ScanHistoryEntry[]; total: number }>({
    queryKey: ["scan-history", id, limit],
    queryFn: () => websiteApi.getScanHistory(id, limit),
    enabled: !!id,
  });
}

export function usePluginScans(id: string) {
  return useQuery<PluginScanEntry[]>({
    queryKey: ["plugin-scans", id],
    queryFn: () => websiteApi.getPluginScans(id),
    enabled: !!id,
  });
}

export function useThemeScans(id: string) {
  return useQuery<ThemeScanEntry[]>({
    queryKey: ["theme-scans", id],
    queryFn: () => websiteApi.getThemeScans(id),
    enabled: !!id,
  });
}

export function useHealthDiagnostics(id: string) {
  return useQuery<any>({
    queryKey: ["health-diagnostics", id],
    queryFn: () => websiteApi.getHealthDiagnostics(id),
    enabled: !!id,
  });
}

export function useBrokenLinks(id: string) {
  return useQuery<any>({
    queryKey: ["broken-links", id],
    queryFn: () => websiteApi.getBrokenLinks(id),
    enabled: !!id,
  });
}