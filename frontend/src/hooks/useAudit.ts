import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auditApi } from "@/modules/audit/services";
import type {
  AuditRun,
  TechnicalIssue,
  AuditFinding,
  BlackHatDetection,
  GreyHatDetection,
  AuditExportResult,
} from "@/modules/audit/types";

export function useAuditRuns(params?: {
  foundation_project_id?: string;
  status?: string;
  audit_type?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: AuditRun[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["audit-runs", params],
    queryFn: () => auditApi.listRuns(params),
  });
}

export function useAuditRun(runId: string | null) {
  return useQuery<AuditRun>({
    queryKey: ["audit-run", runId],
    queryFn: () => auditApi.getRun(runId!),
    enabled: !!runId,
  });
}

export function useCreateAuditRun() {
  const queryClient = useQueryClient();
  return useMutation<AuditRun, Error, { audit_type: string; audit_name: string; foundation_project_id?: string }>({
    mutationFn: auditApi.createRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-runs"] });
    },
  });
}

export function useUpdateAuditRun() {
  const queryClient = useQueryClient();
  return useMutation<AuditRun, Error, { id: string; data: Partial<AuditRun> }>({
    mutationFn: ({ id, data }) => auditApi.updateRun(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-runs"] });
    },
  });
}

export function useAuditIssues(runId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: TechnicalIssue[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["audit-issues", runId, params],
    queryFn: () => auditApi.listIssues(runId, params),
    enabled: !!runId,
  });
}

export function useAuditFindings(runId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: AuditFinding[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["audit-findings", runId, params],
    queryFn: () => auditApi.listFindings(runId, params),
    enabled: !!runId,
  });
}

export function useBlackHatDetections(runId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: BlackHatDetection[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["black-hat", runId, params],
    queryFn: () => auditApi.listBlackHat(runId, params),
    enabled: !!runId,
  });
}

export function useGreyHatDetections(runId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: GreyHatDetection[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["grey-hat", runId, params],
    queryFn: () => auditApi.listGreyHat(runId, params),
    enabled: !!runId,
  });
}

export function useAddBlackHat() {
  const queryClient = useQueryClient();
  return useMutation<BlackHatDetection, Error, { runId: string; data: { technique: string; technique_category: string; severity: string; url?: string; description?: string; evidence?: string; impact?: string; recommendation?: string } }>({
    mutationFn: ({ runId, data }) => auditApi.addBlackHat(runId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["black-hat"] });
    },
  });
}

export function useAddGreyHat() {
  const queryClient = useQueryClient();
  return useMutation<GreyHatDetection, Error, { runId: string; data: { technique: string; technique_category: string; severity: string; url?: string; description?: string; evidence?: string; risk_assessment?: string; recommendation?: string } }>({
    mutationFn: ({ runId, data }) => auditApi.addGreyHat(runId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grey-hat"] });
    },
  });
}

export function useExportAudit() {
  const queryClient = useQueryClient();
  return useMutation<AuditExportResult, Error, { runId: string; format?: string; include_findings?: boolean; include_recommendations?: boolean }>({
    mutationFn: ({ runId, ...rest }) => auditApi.exportAudit(runId, rest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-runs"] });
    },
  });
}
export function useDeleteAuditRun() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (runId) => auditApi.deleteRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-runs"] });
    },
  });
}
