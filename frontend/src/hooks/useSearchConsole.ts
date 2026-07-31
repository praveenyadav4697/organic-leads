import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { searchConsoleApi } from "@/modules/search-console/services";
import type {
  SearchConsoleProperty,
  SearchConsolePropertyCreate,
  SearchConsolePropertyUpdate,
  UrlInspectionResult,
  SitemapEntry,
  ManualAction,
  CrawlError,
  SearchEnhancement,
  PerformanceResponse,
} from "@/modules/search-console/types";

export function useSearchConsoleProperties(params?: {
  page?: number;
  page_size?: number;
  connection_status?: string;
}) {
  return useQuery<{
    items: SearchConsoleProperty[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["search-console-properties", params],
    queryFn: () => searchConsoleApi.listProperties(params),
  });
}

export function useSearchConsoleProperty(propertyId: string | null) {
  return useQuery<SearchConsoleProperty>({
    queryKey: ["search-console-property", propertyId],
    queryFn: () => searchConsoleApi.getProperty(propertyId!),
    enabled: !!propertyId,
  });
}

export function useCreateSearchConsoleProperty() {
  const queryClient = useQueryClient();
  return useMutation<SearchConsoleProperty, Error, SearchConsolePropertyCreate>({
    mutationFn: searchConsoleApi.connectProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-console-properties"] });
    },
  });
}

export function useUpdateSearchConsoleProperty() {
  const queryClient = useQueryClient();
  return useMutation<SearchConsoleProperty, Error, { id: string; data: SearchConsolePropertyUpdate }>({
    mutationFn: ({ id, data }) => searchConsoleApi.updateProperty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-console-properties"] });
    },
  });
}

export function useDeleteSearchConsoleProperty() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: searchConsoleApi.deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search-console-properties"] });
    },
  });
}

export function useUrlInspection(propertyId: string, inspectedUrl: string) {
  return useQuery<UrlInspectionResult>({
    queryKey: ["url-inspection", propertyId, inspectedUrl],
    queryFn: () => searchConsoleApi.inspectUrl(propertyId, inspectedUrl),
    enabled: !!propertyId && !!inspectedUrl,
  });
}

export function useSitemaps(propertyId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: SitemapEntry[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["sitemaps", propertyId, params],
    queryFn: () => searchConsoleApi.listSitemaps(propertyId, params),
    enabled: !!propertyId,
  });
}

export function useManualActions(propertyId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: ManualAction[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["manual-actions", propertyId, params],
    queryFn: () => searchConsoleApi.listManualActions(propertyId, params),
    enabled: !!propertyId,
  });
}

export function useCrawlErrors(propertyId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: CrawlError[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["crawl-errors", propertyId, params],
    queryFn: () => searchConsoleApi.listCrawlErrors(propertyId, params),
    enabled: !!propertyId,
  });
}

export function useEnhancements(propertyId: string) {
  return useQuery<SearchEnhancement[]>({
    queryKey: ["enhancements", propertyId],
    queryFn: () => searchConsoleApi.listEnhancements(propertyId),
    enabled: !!propertyId,
  });
}

export function usePerformance(propertyId: string, startDate: string, endDate: string) {
  return useQuery<PerformanceResponse>({
    queryKey: ["performance", propertyId, startDate, endDate],
    queryFn: () => searchConsoleApi.getPerformance(propertyId, startDate, endDate),
    enabled: !!propertyId && !!startDate && !!endDate,
  });
}