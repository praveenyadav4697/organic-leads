import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessApi } from "@/modules/business/services";
import type {
  BusinessProfile,
  BusinessProfileCreate,
  BusinessProfileUpdate,
  Competitor,
  CompetitorCreate,
  Keyword,
  KeywordCreate,
  KeywordCluster,
  KeywordClusterCreate,
  KeywordOpportunity,
  SERPResult,
  RankTrackingEntry,
} from "@/modules/business/types";

export function useBusinessProfiles(params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: BusinessProfile[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["business-profiles", params],
    queryFn: () => businessApi.listProfiles(params),
  });
}

export function useBusinessProfile(profileId: string | null) {
  return useQuery<BusinessProfile>({
    queryKey: ["business-profile", profileId],
    queryFn: () => businessApi.getProfile(profileId!),
    enabled: !!profileId,
  });
}

export function useCreateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation<BusinessProfile, Error, BusinessProfileCreate>({
    mutationFn: businessApi.createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profiles"] });
    },
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation<BusinessProfile, Error, { id: string; data: BusinessProfileUpdate }>({
    mutationFn: ({ id, data }) => businessApi.updateProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profiles"] });
    },
  });
}

export function useDeleteBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: businessApi.deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-profiles"] });
    },
  });
}

export function useCompetitors(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: Competitor[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["competitors", profileId, params],
    queryFn: () => businessApi.listCompetitors(profileId, params),
    enabled: !!profileId,
  });
}

export function useCreateCompetitor() {
  const queryClient = useQueryClient();
  return useMutation<Competitor, Error, { profileId: string; data: CompetitorCreate }>({
    mutationFn: ({ profileId, data }) => businessApi.createCompetitor(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
    },
  });
}

export function useKeywords(profileId: string, params?: { page?: number; page_size?: number; is_tracked?: boolean }) {
  return useQuery<{
    items: Keyword[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["keywords", profileId, params],
    queryFn: () => businessApi.listKeywords(profileId, params),
    enabled: !!profileId,
  });
}

export function useCreateKeyword() {
  const queryClient = useQueryClient();
  return useMutation<Keyword, Error, { profileId: string; data: KeywordCreate }>({
    mutationFn: ({ profileId, data }) => businessApi.createKeyword(profileId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
    },
  });
}

export function useClusters(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: KeywordCluster[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["clusters", profileId, params],
    queryFn: () => businessApi.listClusters(profileId, params),
    enabled: !!profileId,
  });
}

export function useOpportunities(profileId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: KeywordOpportunity[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["opportunities", profileId, params],
    queryFn: () => businessApi.listOpportunities(profileId, params),
    enabled: !!profileId,
  });
}

export function useSaveSerp() {
  const queryClient = useQueryClient();
  return useMutation<SERPResult, Error, { business_profile_id: string; keyword_id?: string; keyword_text?: string; device?: string }>({
    mutationFn: businessApi.saveSerpResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["serp"] });
    },
  });
}

export function useRankTracking(profileId: string, status?: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: RankTrackingEntry[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["rank-tracking", profileId, status, params],
    queryFn: () => businessApi.listRankTracking(profileId, status, params),
    enabled: !!profileId,
  });
}