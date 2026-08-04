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
import type { Theme, Plugin } from "@/modules/website-foundation/types";
import { websiteService } from "@/modules/website-foundation/services";

export function useWebsites(params?: { page?: number; page_size?: number; environment?: string }) {
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
  return useMutation<WebsiteRegistrationResponse, Error, WebsiteRegistrationCreate>({
    mutationFn: websiteApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["websites"] });
    },
  });
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
  return useMutation<WebsiteScanResponse, Error, { id: string; params?: WebsiteScanRequest }>({
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

export function useThemes(websiteId: string) {
  return useQuery<Theme[]>({
    queryKey: ["themes", websiteId],
    queryFn: () => websiteApi.listThemes(websiteId),
    enabled: !!websiteId,
  });
}

export function useThemeDetail(websiteId: string, slug: string) {
  return useQuery<any>({
    queryKey: ["theme-detail", websiteId, slug],
    queryFn: () => websiteApi.getTheme(websiteId, slug),
    enabled: !!websiteId && !!slug,
  });
}

export function useInstallTheme() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; formData: FormData }>({
    mutationFn: ({ websiteId, formData }) => websiteApi.uploadTheme(websiteId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["themes", variables.websiteId] });
    },
  });
}

export function useActivateTheme() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string }>({
    mutationFn: ({ websiteId, slug }) => websiteApi.activateTheme(websiteId, { slug }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["themes", variables.websiteId] });
    },
  });
}

export function useDeleteTheme() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string }>({
    mutationFn: ({ websiteId, slug }) => websiteApi.deleteTheme(websiteId, slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["themes", variables.websiteId] });
    },
  });
}

export function useUpdateTheme() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string }>({
    mutationFn: ({ websiteId, slug }) => websiteApi.updateTheme(websiteId, { slug }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["themes", variables.websiteId] });
    },
  });
}

// Plugin hooks

export function usePlugins(websiteId: string) {
  return useQuery<Plugin[]>({
    queryKey: ["plugins", websiteId],
    queryFn: () => websiteApi.listPlugins(websiteId),
    enabled: !!websiteId,
  });
}

export function usePluginDetail(websiteId: string, slug: string) {
  return useQuery<any>({
    queryKey: ["plugin-detail", websiteId, slug],
    queryFn: () => websiteApi.getPlugin(websiteId, slug),
    enabled: !!websiteId && !!slug,
  });
}

export function usePluginSearch(websiteId: string, query: string, page = 1) {
  return useQuery<any>({
    queryKey: ["plugin-search", websiteId, query, page],
    queryFn: () => websiteApi.searchPlugins(websiteId, query, 10, page),
    enabled: !!websiteId && !!query,
  });
}

export function usePluginsHealth(websiteId: string) {
  return useQuery<any>({
    queryKey: ["plugins-health", websiteId],
    queryFn: () => websiteApi.getPluginsHealth(websiteId),
    enabled: !!websiteId,
  });
}

export function usePluginsSecurity(websiteId: string) {
  return useQuery<any>({
    queryKey: ["plugins-security", websiteId],
    queryFn: () => websiteApi.getPluginsSecurity(websiteId),
    enabled: !!websiteId,
  });
}

export function usePluginLogs(websiteId: string, limit = 50) {
  return useQuery<any>({
    queryKey: ["plugin-logs", websiteId, limit],
    queryFn: () => websiteApi.getPluginLogs(websiteId, limit),
    enabled: !!websiteId,
  });
}

export function useInstallPlugin() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string }>({
    mutationFn: ({ websiteId, slug }) => websiteApi.installPluginFromRepo(websiteId, slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugins", variables.websiteId] });
      queryClient.invalidateQueries({ queryKey: ["plugins-health", variables.websiteId] });
    },
  });
}

export function useUploadPlugin() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; formData: FormData }>({
    mutationFn: ({ websiteId, formData }) => websiteApi.uploadPlugin(websiteId, formData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugins", variables.websiteId] });
      queryClient.invalidateQueries({ queryKey: ["plugins-health", variables.websiteId] });
    },
  });
}

export function useActivatePlugin() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string }>({
    mutationFn: ({ websiteId, slug }) => websiteApi.activatePlugin(websiteId, slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugins", variables.websiteId] });
      queryClient.invalidateQueries({ queryKey: ["plugins-health", variables.websiteId] });
    },
  });
}

export function useDeactivatePlugin() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string }>({
    mutationFn: ({ websiteId, slug }) => websiteApi.deactivatePlugin(websiteId, slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugins", variables.websiteId] });
      queryClient.invalidateQueries({ queryKey: ["plugins-health", variables.websiteId] });
    },
  });
}

export function useDeletePlugin() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string }>({
    mutationFn: ({ websiteId, slug }) => websiteApi.deletePlugin(websiteId, slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugins", variables.websiteId] });
      queryClient.invalidateQueries({ queryKey: ["plugins-health", variables.websiteId] });
    },
  });
}

export function useUpdatePlugin() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string }>({
    mutationFn: ({ websiteId, slug }) => websiteApi.updatePlugin(websiteId, slug),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugins", variables.websiteId] });
    },
  });
}

export function useRollbackPlugin() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string; version: string }>({
    mutationFn: ({ websiteId, slug, version }) =>
      websiteApi.rollbackPlugin(websiteId, slug, version),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugins", variables.websiteId] });
    },
  });
}

export function useSetPluginAutoUpdate() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; slug: string; enabled: boolean }>({
    mutationFn: ({ websiteId, slug, enabled }) =>
      websiteApi.setPluginAutoUpdate(websiteId, slug, enabled),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plugins", variables.websiteId] });
    },
  });
}

// Form management hooks

export function useForms(websiteId: string) {
  return useQuery<any[]>({
    queryKey: ["forms", websiteId],
    queryFn: () => websiteApi.listForms(websiteId),
    enabled: !!websiteId,
  });
}

export function useFormDetail(websiteId: string, formId: string) {
  return useQuery<any>({
    queryKey: ["form-detail", websiteId, formId],
    queryFn: () => websiteApi.getForm(websiteId, formId),
    enabled: !!websiteId && !!formId,
  });
}

export function useFormsHealth(websiteId: string) {
  return useQuery<any>({
    queryKey: ["forms-health", websiteId],
    queryFn: () => websiteApi.getFormsHealth(websiteId),
    enabled: !!websiteId,
  });
}

export function useFormLogs(websiteId: string, limit = 50) {
  return useQuery<any>({
    queryKey: ["form-logs", websiteId, limit],
    queryFn: () => websiteApi.getFormLogs(websiteId, limit),
    enabled: !!websiteId,
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; formId: string; data: any }>({
    mutationFn: ({ websiteId, formId, data }) => websiteApi.updateForm(websiteId, formId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forms", variables.websiteId] });
      queryClient.invalidateQueries({
        queryKey: ["form-detail", variables.websiteId, variables.formId],
      });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; formId: string }>({
    mutationFn: ({ websiteId, formId }) => websiteApi.deleteForm(websiteId, formId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forms", variables.websiteId] });
      queryClient.invalidateQueries({ queryKey: ["forms-health", variables.websiteId] });
    },
  });
}

export function usePublishForm() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; formId: string }>({
    mutationFn: ({ websiteId, formId }) => websiteApi.publishForm(websiteId, formId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forms", variables.websiteId] });
    },
  });
}

export function useUnpublishForm() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; formId: string }>({
    mutationFn: ({ websiteId, formId }) => websiteApi.unpublishForm(websiteId, formId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forms", variables.websiteId] });
    },
  });
}

export function useDuplicateForm() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { websiteId: string; formId: string }>({
    mutationFn: ({ websiteId, formId }) => websiteApi.duplicateForm(websiteId, formId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forms", variables.websiteId] });
    },
  });
}
