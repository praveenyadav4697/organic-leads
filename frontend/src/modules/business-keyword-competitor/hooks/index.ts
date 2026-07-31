import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessKeywordCompetitorApi } from "@/modules/business-keyword-competitor/services";
import type {
  BusinessProfile,
  BusinessProfileCreate,
  BusinessProfileUpdate,
  Competitor,
  CompetitorCreate,
  CompetitorUpdate,
  Keyword,
  KeywordCreate,
  KeywordUpdate,
  KeywordCluster,
  KeywordClusterCreate,
  KeywordClusterUpdate,
  KeywordOpportunity,
  SERPResult,
  RankTrackingEntry,
  KeywordResearchResult,
  ContentGap,
  SearchTrend,
  Recommendation,
  MarketInsight,
  BusinessKeywordCompetitorFilters,
  ResearchScanRequest,
  ResearchScanResponse,
  ExportResponse,
  ResearchHistoryEntry,
} from "@/modules/business-keyword-competitor/types";

export function useBusinessOverview(filters?: BusinessKeywordCompetitorFilters) {
  return useQuery<MarketInsight>({
    queryKey: ["business-overview", filters],
    queryFn: () => businessKeywordCompetitorApi.getOverview(filters),
  });
}

export function useBusinessProfiles(params?: { page?: number; page_size?: number }) {
  return useQuery<{ items: BusinessProfile[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["business-profiles", params],
    queryFn: () => businessKeywordCompetitorApi.listProfiles(params),
  });
}

export function useBusinessProfile(profileId: string) {
  return useQuery<BusinessProfile>({
    queryKey: ["business-profile", profileId],
    queryFn: () => businessKeywordCompetitorApi.getProfile(profileId),
    enabled: !!profileId,
  });
}

export function useCreateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation<BusinessProfile, Error, BusinessProfileCreate>({
    mutationFn: businessKeywordCompetitorApi.createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profiles"] });
    },
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation<BusinessProfile, Error, { profileId: string; data: Partial<BusinessProfile> }>({
    mutationFn: ({ profileId, data }) => businessKeywordCompetitorApi.updateProfile(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profiles"] });
    },
  });
}

export function useDeleteBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: businessKeywordCompetitorApi.deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profiles"] });
    },
  });
}

export function useKeywords(profileId: string, filters?: BusinessKeywordCompetitorFilters & { page?: number; page_size?: number; sortBy?: string; sortOrder?: string; search?: string }) {
  return useQuery<{ items: Keyword[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["business-keywords", profileId, filters],
    queryFn: () => businessKeywordCompetitorApi.listKeywords(profileId, filters),
    enabled: !!profileId,
  });
}

export function useCreateKeyword() {
  const queryClient = useQueryClient();
  return useMutation<Keyword, Error, { profileId: string; data: KeywordCreate }>({
    mutationFn: ({ profileId, data }) => businessKeywordCompetitorApi.createKeyword(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-keywords"] });
    },
  });
}

export function useUpdateKeyword() {
  const queryClient = useQueryClient();
  return useMutation<Keyword, Error, { keywordId: string; data: Partial<Keyword> }>({
    mutationFn: ({ keywordId, data }) => businessKeywordCompetitorApi.updateKeyword(keywordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-keywords"] });
    },
  });
}

export function useDeleteKeyword() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: businessKeywordCompetitorApi.deleteKeyword,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-keywords"] });
    },
  });
}

export function useKeywordClusters(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{ items: KeywordCluster[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["business-clusters", profileId, params],
    queryFn: () => businessKeywordCompetitorApi.listClusters(profileId, params),
    enabled: !!profileId,
  });
}

export function useCreateCluster() {
  const queryClient = useQueryClient();
  return useMutation<KeywordCluster, Error, { profileId: string; data: KeywordClusterCreate }>({
    mutationFn: ({ profileId, data }) => businessKeywordCompetitorApi.createCluster(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-clusters"] });
    },
  });
}

export function useUpdateCluster() {
  const queryClient = useQueryClient();
  return useMutation<KeywordCluster, Error, { clusterId: string; data: Partial<KeywordCluster> }>({
    mutationFn: ({ clusterId, data }) => businessKeywordCompetitorApi.updateCluster(clusterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-clusters"] });
    },
  });
}

export function useDeleteCluster() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: businessKeywordCompetitorApi.deleteCluster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-clusters"] });
    },
  });
}

export function useKeywordOpportunities(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{ items: KeywordOpportunity[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["business-opportunities", profileId, params],
    queryFn: () => businessKeywordCompetitorApi.listOpportunities(profileId, params),
    enabled: !!profileId,
  });
}

export function useCompetitors(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{ items: Competitor[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["business-competitors", profileId, params],
    queryFn: () => businessKeywordCompetitorApi.listCompetitors(profileId, params),
    enabled: !!profileId,
  });
}

export function useCreateCompetitor() {
  const queryClient = useQueryClient();
  return useMutation<Competitor, Error, { profileId: string; data: CompetitorCreate }>({
    mutationFn: ({ profileId, data }) => businessKeywordCompetitorApi.createCompetitor(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-competitors"] });
    },
  });
}

export function useUpdateCompetitor() {
  const queryClient = useQueryClient();
  return useMutation<Competitor, Error, { competitorId: string; data: CompetitorUpdate }>({
    mutationFn: ({ competitorId, data }) => businessKeywordCompetitorApi.updateCompetitor(competitorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-competitors"] });
    },
  });
}

export function useDeleteCompetitor() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: businessKeywordCompetitorApi.deleteCompetitor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-competitors"] });
    },
  });
}

export function useRankTracking(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{ items: RankTrackingEntry[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["business-rank-tracking", profileId, params],
    queryFn: () => businessKeywordCompetitorApi.listRankTracking(profileId, params),
    enabled: !!profileId,
  });
}

export function useSERPs(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{ items: SERPResult[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["business-serp", profileId, params],
    queryFn: () => businessKeywordCompetitorApi.listSERPs(profileId, params),
    enabled: !!profileId,
  });
}

export function useContentGaps(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{ items: ContentGap[]; total: number; page: number; page_size: number; total_pages: number }>({
    queryKey: ["business-content-gaps", profileId, params],
    queryFn: () => businessKeywordCompetitorApi.listContentGaps(profileId, params),
    enabled: !!profileId,
  });
}

export function useSearchTrends(profileId: string) {
  return useQuery<SearchTrend[]>({
    queryKey: ["business-search-trends", profileId],
    queryFn: () => businessKeywordCompetitorApi.listSearchTrends(profileId),
    enabled: !!profileId,
  });
}

export function useRecommendations(profileId: string) {
  return useQuery<Recommendation[]>({
    queryKey: ["business-recommendations", profileId],
    queryFn: () => businessKeywordCompetitorApi.listRecommendations(profileId),
    enabled: !!profileId,
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation<Recommendation, Error, { recommendationId: string; data: { status: string } }>({
    mutationFn: ({ recommendationId, data }) => businessKeywordCompetitorApi.updateRecommendation(recommendationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-recommendations"] });
    },
  });
}

export function useResearchHistory(profileId: string) {
  return useQuery<ResearchHistoryEntry[]>({
    queryKey: ["business-history", profileId],
    queryFn: () => businessKeywordCompetitorApi.listHistory(profileId),
    enabled: !!profileId,
  });
}

export function useRunResearch() {
  const queryClient = useQueryClient();
  return useMutation<ResearchScanResponse, Error, ResearchScanRequest>({
    mutationFn: businessKeywordCompetitorApi.runResearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-overview"] });
      queryClient.invalidateQueries({ queryKey: ["business-keywords"] });
      queryClient.invalidateQueries({ queryKey: ["business-competitors"] });
      queryClient.invalidateQueries({ queryKey: ["business-opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["business-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["business-history"] });
    },
  });
}

export function useExportData() {
  return useMutation<ExportResponse, Error, { profileId: string; format: string; scope?: string }>({
    mutationFn: ({ profileId, format, scope }) => businessKeywordCompetitorApi.exportData(profileId, format as any, scope),
  });
}

export function useApproveResults() {
  const queryClient = useQueryClient();
  return useMutation<{ approved: number; rejected: number; completed: number }, Error, { profileId: string; data: { items: string[]; action: "approve" | "reject" | "mark_complete" } }>({
    mutationFn: ({ profileId, data }) => businessKeywordCompetitorApi.approveResults(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["business-keywords"] });
    },
  });
}