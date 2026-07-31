import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchKnowledgeApi } from "@/modules/search-knowledge/services";
import type {
  KnowledgeOverview,
  PaginatedEntities,
  PaginatedTopics,
  PaginatedKeywords,
  Recommendation,
  SearchTrend,
  QuestionItem,
  Competitor,
  ContentGap,
  ScanLog,
  HistorySnapshot,
  ScanRequest,
  ScanResponse,
  SearchKnowledgeFilters,
} from "@/modules/search-knowledge/types";

export function useKnowledgeOverview(filters?: SearchKnowledgeFilters) {
  return useQuery<KnowledgeOverview>({
    queryKey: ["search-knowledge-overview", filters],
    queryFn: () => searchKnowledgeApi.getOverview(filters),
  });
}

export function useEntities(filters?: SearchKnowledgeFilters & { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string; search?: string }) {
  return useQuery<PaginatedEntities>({
    queryKey: ["search-knowledge-entities", filters],
    queryFn: () => searchKnowledgeApi.getEntities(filters),
  });
}

export function useTopics(filters?: SearchKnowledgeFilters & { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string }) {
  return useQuery<PaginatedTopics>({
    queryKey: ["search-knowledge-topics", filters],
    queryFn: () => searchKnowledgeApi.getTopics(filters),
  });
}

export function useKeywords(filters?: SearchKnowledgeFilters & { page?: number; pageSize?: number; sortBy?: string; sortOrder?: string; search?: string }) {
  return useQuery<PaginatedKeywords>({
    queryKey: ["search-knowledge-keywords", filters],
    queryFn: () => searchKnowledgeApi.getKeywords(filters),
  });
}

export function useIntent(filters?: SearchKnowledgeFilters) {
  return useQuery<{ informational: number; navigational: number; commercial: number; transactional: number; questionBased: number }>({
    queryKey: ["search-knowledge-intent", filters],
    queryFn: () => searchKnowledgeApi.getIntent(filters),
  });
}

export function useCompetitors(filters?: SearchKnowledgeFilters) {
  return useQuery<Competitor[]>({
    queryKey: ["search-knowledge-competitors", filters],
    queryFn: () => searchKnowledgeApi.getCompetitors(filters),
  });
}

export function useRecommendations() {
  return useQuery<Recommendation[]>({
    queryKey: ["search-knowledge-recommendations"],
    queryFn: () => searchKnowledgeApi.getRecommendations(),
  });
}

export function useSearchTrends(filters?: SearchKnowledgeFilters) {
  return useQuery<SearchTrend[]>({
    queryKey: ["search-knowledge-trends", filters],
    queryFn: () => searchKnowledgeApi.getSearchTrends(filters),
  });
}

export function useQuestions(filters?: SearchKnowledgeFilters) {
  return useQuery<QuestionItem[]>({
    queryKey: ["search-knowledge-questions", filters],
    queryFn: () => searchKnowledgeApi.getQuestions(filters),
  });
}

export function useContentGaps(filters?: SearchKnowledgeFilters) {
  return useQuery<ContentGap[]>({
    queryKey: ["search-knowledge-content-gaps", filters],
    queryFn: () => searchKnowledgeApi.getContentGaps(filters),
  });
}

export function useLogs(filters?: SearchKnowledgeFilters & { page?: number; pageSize?: number }) {
  return useQuery<{ items: ScanLog[]; total: number; page: number; pageSize: number; totalPages: number }>({
    queryKey: ["search-knowledge-logs", filters],
    queryFn: () => searchKnowledgeApi.getLogs(filters),
  });
}

export function useHistory() {
  return useQuery<HistorySnapshot[]>({
    queryKey: ["search-knowledge-history"],
    queryFn: () => searchKnowledgeApi.getHistory(),
  });
}

export function useRunScan() {
  const queryClient = useQueryClient();
  return useMutation<ScanResponse, Error, ScanRequest>({
    mutationFn: (data) => searchKnowledgeApi.runScan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-overview"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-entities"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-topics"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-keywords"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-intent"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-competitors"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-trends"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-questions"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-content-gaps"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-logs"] });
      queryClient.invalidateQueries({ queryKey: ["search-knowledge-history"] });
    },
  });
}