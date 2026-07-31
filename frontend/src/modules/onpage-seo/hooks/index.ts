import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { onpageSeoApi } from "@/modules/onpage-seo/services";
import type {
  SEOOverview,
  SEOPage,
  SEOPageCreate,
  SEOPageUpdate,
  SEOAuditFinding,
  SEOKeyword,
  SEMetaTag,
  SEHeading,
  SEContent,
  SEImage,
  SEInternalLink,
  SEExternalLink,
  SECanonical,
  SERobots,
  SESitemap,
  SESchema,
  SEAnswerReadiness,
  SERecommendation,
  SEOHistoryEntry,
  SEOLogsEntry,
  SEOFilters,
  SEOScanRequest,
  SEOScanResponse,
  SEOExportResponse,
  BulkOptimizationRequest,
  BulkOptimizationResult,
} from "@/modules/onpage-seo/types";

export function useSEOOverview(filters?: SEOFilters) {
  return useQuery<SEOOverview>({
    queryKey: ["onpage-seo-overview", filters],
    queryFn: () => onpageSeoApi.getOverview(filters),
  });
}

export function useSEOPages(filters?: SEOFilters & { page?: number; page_size?: number; sortBy?: string; sortOrder?: string; search?: string }) {
  return useQuery<{ items: SEOPage[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["onpage-seo-pages", filters],
    queryFn: () => onpageSeoApi.listPages(filters),
  });
}

export function useSEOPage(pageId: string) {
  return useQuery<SEOPage>({
    queryKey: ["onpage-seo-page", pageId],
    queryFn: () => onpageSeoApi.getPage(pageId),
    enabled: !!pageId,
  });
}

export function useCreateSEOPage() {
  const queryClient = useQueryClient();
  return useMutation<SEOPage, Error, SEOPageCreate>({
    mutationFn: onpageSeoApi.createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-pages"] });
    },
  });
}

export function useUpdateSEOPage() {
  const queryClient = useQueryClient();
  return useMutation<SEOPage, Error, { pageId: string; data: Partial<SEOPage> }>({
    mutationFn: ({ pageId, data }) => onpageSeoApi.updatePage(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-pages"] });
    },
  });
}

export function useDeleteSEOPage() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: onpageSeoApi.deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-pages"] });
    },
  });
}

export function useSEOAudit(pageId: string) {
  return useQuery<SEOAuditFinding[]>({
    queryKey: ["onpage-seo-audit", pageId],
    queryFn: () => onpageSeoApi.getAudit(pageId),
    enabled: !!pageId,
  });
}

export function useSEOKeywords(pageId: string) {
  return useQuery<SEOKeyword[]>({
    queryKey: ["onpage-seo-keywords", pageId],
    queryFn: () => onpageSeoApi.getKeywords(pageId),
    enabled: !!pageId,
  });
}

export function useSEOMetaTags(pageId: string) {
  return useQuery<SEMetaTag[]>({
    queryKey: ["onpage-seo-meta", pageId],
    queryFn: () => onpageSeoApi.getMetaTags(pageId),
    enabled: !!pageId,
  });
}

export function useSEHeadings(pageId: string) {
  return useQuery<SEHeading[]>({
    queryKey: ["onpage-seo-headings", pageId],
    queryFn: () => onpageSeoApi.getHeadings(pageId),
    enabled: !!pageId,
  });
}

export function useSEContent(pageId: string) {
  return useQuery<SEContent>({
    queryKey: ["onpage-seo-content", pageId],
    queryFn: () => onpageSeoApi.getContent(pageId),
    enabled: !!pageId,
  });
}

export function useSEImages(pageId: string) {
  return useQuery<SEImage[]>({
    queryKey: ["onpage-seo-images", pageId],
    queryFn: () => onpageSeoApi.getImages(pageId),
    enabled: !!pageId,
  });
}

export function useSEInternalLinks(pageId: string) {
  return useQuery<SEInternalLink[]>({
    queryKey: ["onpage-seo-internal-links", pageId],
    queryFn: () => onpageSeoApi.getInternalLinks(pageId),
    enabled: !!pageId,
  });
}

export function useSEExternalLinks(pageId: string) {
  return useQuery<SEExternalLink[]>({
    queryKey: ["onpage-seo-external-links", pageId],
    queryFn: () => onpageSeoApi.getExternalLinks(pageId),
    enabled: !!pageId,
  });
}

export function useSECanonical(pageId: string) {
  return useQuery<SECanonical>({
    queryKey: ["onpage-seo-canonical", pageId],
    queryFn: () => onpageSeoApi.getCanonical(pageId),
    enabled: !!pageId,
  });
}

export function useSERobots(pageId: string) {
  return useQuery<SERobots>({
    queryKey: ["onpage-seo-robots", pageId],
    queryFn: () => onpageSeoApi.getRobots(pageId),
    enabled: !!pageId,
  });
}

export function useSESitemap(pageId: string) {
  return useQuery<SESitemap>({
    queryKey: ["onpage-seo-sitemap", pageId],
    queryFn: () => onpageSeoApi.getSitemap(pageId),
    enabled: !!pageId,
  });
}

export function useSESchema(pageId: string) {
  return useQuery<SESchema[]>({
    queryKey: ["onpage-seo-schema", pageId],
    queryFn: () => onpageSeoApi.getSchema(pageId),
    enabled: !!pageId,
  });
}

export function useSEAnswerReadiness(pageId: string) {
  return useQuery<SEAnswerReadiness>({
    queryKey: ["onpage-seo-answer-readiness", pageId],
    queryFn: () => onpageSeoApi.getAnswerReadiness(pageId),
    enabled: !!pageId,
  });
}

export function useSERecommendations(pageId: string) {
  return useQuery<SERecommendation[]>({
    queryKey: ["onpage-seo-recommendations", pageId],
    queryFn: () => onpageSeoApi.getRecommendations(pageId),
    enabled: !!pageId,
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation<SERecommendation, Error, { recommendationId: string; data: { status: string } }>({
    mutationFn: ({ recommendationId, data }) => onpageSeoApi.updateRecommendation(recommendationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-recommendations"] });
    },
  });
}

export function useSEOHistory(pageId: string) {
  return useQuery<SEOHistoryEntry[]>({
    queryKey: ["onpage-seo-history", pageId],
    queryFn: () => onpageSeoApi.getHistory(pageId),
    enabled: !!pageId,
  });
}

export function useSEOLogs(filters?: SEOFilters & { page?: number; page_size?: number }) {
  return useQuery<{ items: SEOLogsEntry[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["onpage-seo-logs", filters],
    queryFn: () => onpageSeoApi.getLogs(filters),
  });
}

export function useRunSEOScan() {
  const queryClient = useQueryClient();
  return useMutation<SEOScanResponse, Error, SEOScanRequest>({
    mutationFn: onpageSeoApi.runScan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-overview"] });
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-pages"] });
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-audit"] });
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-recommendations"] });
    },
  });
}

export function useVerifyFixes() {
  const queryClient = useQueryClient();
  return useMutation<{ verified: number; failed: number; message: string }, Error, string>({
    mutationFn: onpageSeoApi.verifyFixes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-pages"] });
    },
  });
}

export function useBulkOptimize() {
  const queryClient = useQueryClient();
  return useMutation<BulkOptimizationResult, Error, BulkOptimizationRequest>({
    mutationFn: onpageSeoApi.bulkOptimize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-pages"] });
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-overview"] });
    },
  });
}

export function useApproveChanges() {
  const queryClient = useQueryClient();
  return useMutation<{ approved: number; rejected: number; completed: number }, Error, { pageId: string; data: { items: string[]; action: "approve" | "reject" | "mark_complete" } }>({
    mutationFn: ({ pageId, data }) => onpageSeoApi.approveChanges(pageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["onpage-seo-pages"] });
    },
  });
}

export function useExportSEOData() {
  return useMutation<SEOExportResponse, Error, { pageId: string; format: string; scope?: string }>({
    mutationFn: ({ pageId, format, scope }) => onpageSeoApi.exportData(pageId, format as any, scope),
  });
}