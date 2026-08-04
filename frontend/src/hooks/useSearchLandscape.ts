import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchLandscapeApi } from "@/modules/search-landscape/services";
import type {
  AlgorithmUpdate,
  ApprovalEntityType,
  KnowledgeItem,
  KnowledgeSource,
  KnowledgeVersion,
  OverviewStats,
  SearchOperator,
  SerpFeature,
  SyncLog,
} from "@/modules/search-landscape/types";

const LANDSCAPE_KEY = "search-landscape";

export function useSearchLandscapeOverview() {
  return useQuery<OverviewStats>({
    queryKey: [LANDSCAPE_KEY, "overview"],
    queryFn: () => searchLandscapeApi.getOverview(),
  });
}

export function useSerpFeatures() {
  return useQuery<SerpFeature[]>({
    queryKey: [LANDSCAPE_KEY, "serp-features"],
    queryFn: () => searchLandscapeApi.getSerpFeatures(),
  });
}

export function useAlgorithms() {
  return useQuery<AlgorithmUpdate[]>({
    queryKey: [LANDSCAPE_KEY, "algorithms"],
    queryFn: () => searchLandscapeApi.getAlgorithms(),
  });
}

export function useOperators() {
  return useQuery<SearchOperator[]>({
    queryKey: [LANDSCAPE_KEY, "operators"],
    queryFn: () => searchLandscapeApi.getOperators(),
  });
}

export function useKnowledge() {
  return useQuery<KnowledgeItem[]>({
    queryKey: [LANDSCAPE_KEY, "knowledge"],
    queryFn: () => searchLandscapeApi.getKnowledge(),
  });
}

export function useDocumentation() {
  return useQuery<KnowledgeSource[]>({
    queryKey: [LANDSCAPE_KEY, "documentation"],
    queryFn: () => searchLandscapeApi.getDocumentation(),
  });
}

export function useVersions() {
  return useQuery<KnowledgeVersion[]>({
    queryKey: [LANDSCAPE_KEY, "versions"],
    queryFn: () => searchLandscapeApi.getVersions(),
  });
}

export function useSyncLogs() {
  return useQuery<SyncLog[]>({
    queryKey: [LANDSCAPE_KEY, "sync-logs"],
    queryFn: () => searchLandscapeApi.getSyncLogs(),
  });
}

export function useSyncLandscape() {
  const queryClient = useQueryClient();
  return useMutation<SyncLog, Error, void>({
    mutationFn: () => searchLandscapeApi.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LANDSCAPE_KEY] });
    },
  });
}

export function useApproveItem() {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string; approval_status: string },
    Error,
    { entityType: ApprovalEntityType; id: string; approved: boolean }
  >({
    mutationFn: ({ entityType, id, approved }) =>
      searchLandscapeApi.approve(entityType, id, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LANDSCAPE_KEY, "algorithms"] });
      queryClient.invalidateQueries({ queryKey: [LANDSCAPE_KEY, "knowledge"] });
      queryClient.invalidateQueries({ queryKey: [LANDSCAPE_KEY, "overview"] });
      queryClient.invalidateQueries({ queryKey: [LANDSCAPE_KEY, "versions"] });
    },
  });
}
