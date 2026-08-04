import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { foundationApi } from "@/api/foundationApi";
import type {
  FoundationProject,
  FoundationProjectCreate,
  FoundationProjectUpdate,
  VerifyRequest,
  VerifyResponse,
  InventoryRequest,
  InventoryResponse,
  AuditRequest,
  AuditResponse,
  BackupRequest,
  BackupResponse,
  ApproveRequest,
  ApproveResponse,
  PaginatedResponse,
  ScanRequest,
  ScanResponse,
  OverviewResponse,
  SSLDiscoveryResponse,
  DNSDiscoveryResponse,
  SEODiscoveryResponse,
  SecurityDiscoveryResponse,
  PerformanceDiscoveryResponse,
  WordPressDiscoveryResponse,
  RobotsDiscoveryResponse,
  SitemapDiscoveryResponse,
  ScreenshotResponse,
  ResponsiveDiscoveryResponse,
} from "@/types/foundation";

export function useFoundationProjects(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  return useQuery<PaginatedResponse>({
    queryKey: ["foundation-projects", params],
    queryFn: () => foundationApi.listProjects(params),
  });
}

export function useFoundationProject(id: string) {
  return useQuery<FoundationProject>({
    queryKey: ["foundation-project", id],
    queryFn: () => foundationApi.getProject(id),
    enabled: !!id,
  });
}

export function useCreateFoundationProject() {
  const queryClient = useQueryClient();
  return useMutation<FoundationProject, Error, FoundationProjectCreate>({
    mutationFn: foundationApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foundation-projects"] });
    },
  });
}

export function useUpdateFoundationProject() {
  const queryClient = useQueryClient();
  return useMutation<FoundationProject, Error, { id: string; data: FoundationProjectUpdate }>({
    mutationFn: ({ id, data }) => foundationApi.updateProject(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foundation-project"] });
      queryClient.invalidateQueries({ queryKey: ["foundation-projects"] });
    },
  });
}

export function useDeleteFoundationProject() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: foundationApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foundation-projects"] });
    },
  });
}

export function useVerifyProject() {
  const queryClient = useQueryClient();
  return useMutation<VerifyResponse, Error, { id: string; params?: VerifyRequest }>({
    mutationFn: ({ id, params }) => foundationApi.verifyProject(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foundation-project", variables.id] });
    },
  });
}

export function useRunInventory() {
  const queryClient = useQueryClient();
  return useMutation<InventoryResponse, Error, { id: string; params?: InventoryRequest }>({
    mutationFn: ({ id, params }) => foundationApi.runInventory(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foundation-project", variables.id] });
    },
  });
}

export function useRunAudit() {
  const queryClient = useQueryClient();
  return useMutation<AuditResponse, Error, { id: string; params: AuditRequest }>({
    mutationFn: ({ id, params }) => foundationApi.runAudit(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foundation-project", variables.id] });
    },
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  return useMutation<BackupResponse, Error, { id: string; params?: BackupRequest }>({
    mutationFn: ({ id, params }) => foundationApi.createBackup(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foundation-project", variables.id] });
    },
  });
}

export function useApproveProject() {
  const queryClient = useQueryClient();
  return useMutation<ApproveResponse, Error, { id: string; params: ApproveRequest }>({
    mutationFn: ({ id, params }) => foundationApi.approveProject(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foundation-project", variables.id] });
    },
  });
}

export function useRunDiscoveryScan() {
  const queryClient = useQueryClient();
  return useMutation<ScanResponse, Error, { id: string; params: ScanRequest }>({
    mutationFn: ({ id, params }) => foundationApi.runDiscoveryScan(id, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["foundation-project", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["foundation-projects"] });
    },
  });
}

export function useOverview(id: string) {
  return useQuery<OverviewResponse>({
    queryKey: ["foundation-overview", id],
    queryFn: () => foundationApi.getOverview(id),
    enabled: !!id,
  });
}

export function useSslDiscovery(id: string) {
  return useQuery<SSLDiscoveryResponse>({
    queryKey: ["foundation-ssl", id],
    queryFn: () => foundationApi.getSslDiscovery(id),
    enabled: !!id,
  });
}

export function useDnsDiscovery(id: string) {
  return useQuery<DNSDiscoveryResponse>({
    queryKey: ["foundation-dns", id],
    queryFn: () => foundationApi.getDnsDiscovery(id),
    enabled: !!id,
  });
}

export function useSeoDiscovery(id: string) {
  return useQuery<SEODiscoveryResponse>({
    queryKey: ["foundation-seo", id],
    queryFn: () => foundationApi.getSeoDiscovery(id),
    enabled: !!id,
  });
}

export function useSecurityDiscovery(id: string) {
  return useQuery<SecurityDiscoveryResponse>({
    queryKey: ["foundation-security", id],
    queryFn: () => foundationApi.getSecurityDiscovery(id),
    enabled: !!id,
  });
}

export function usePerformanceDiscovery(id: string) {
  return useQuery<PerformanceDiscoveryResponse>({
    queryKey: ["foundation-performance", id],
    queryFn: () => foundationApi.getPerformanceDiscovery(id),
    enabled: !!id,
  });
}

export function useWordPressDiscovery(id: string) {
  return useQuery<WordPressDiscoveryResponse>({
    queryKey: ["foundation-wordpress", id],
    queryFn: () => foundationApi.getWordPressDiscovery(id),
    enabled: !!id,
  });
}

export function useRobotsDiscovery(id: string) {
  return useQuery<RobotsDiscoveryResponse>({
    queryKey: ["foundation-robots", id],
    queryFn: () => foundationApi.getRobotsDiscovery(id),
    enabled: !!id,
  });
}

export function useSitemapDiscovery(id: string) {
  return useQuery<SitemapDiscoveryResponse>({
    queryKey: ["foundation-sitemap", id],
    queryFn: () => foundationApi.getSitemapDiscovery(id),
    enabled: !!id,
  });
}

export function useScreenshotDiscovery(id: string) {
  return useQuery<ScreenshotResponse>({
    queryKey: ["foundation-screenshot", id],
    queryFn: () => foundationApi.getScreenshotDiscovery(id),
    enabled: !!id,
  });
}

export function useResponsiveDiscovery(id: string) {
  return useQuery<ResponsiveDiscoveryResponse>({
    queryKey: ["foundation-responsive", id],
    queryFn: () => foundationApi.getResponsiveDiscovery(id),
    enabled: !!id,
  });
}
