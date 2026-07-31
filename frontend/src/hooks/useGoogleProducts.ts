import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { googleProductsApi } from "@/modules/google-products/services";
import type {
  GoogleProductConnection,
  TagManagerVariable,
  TagManagerTrigger,
  TagManagerTag,
  GoogleAdsAccount,
  AdSenseAccount,
  TrendsQuery,
} from "@/modules/google-products/types";

export function useGoogleProductConnections(params?: {
  product_type?: string;
  connection_status?: string;
  health_status?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: GoogleProductConnection[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["google-product-connections", params],
    queryFn: () => googleProductsApi.listConnections(params),
  });
}

export function useGoogleProductConnection(connId: string | null) {
  return useQuery<GoogleProductConnection>({
    queryKey: ["google-product-connection", connId],
    queryFn: () => googleProductsApi.getConnection(connId!),
    enabled: !!connId,
  });
}

export function useConnectGoogleProduct() {
  const queryClient = useQueryClient();
  return useMutation<GoogleProductConnection, Error, { product_type: string; product_name: string; property_id?: string; tracking_id?: string; account_id?: string; connection_status?: string; is_active?: boolean; created_by: string }>({
    mutationFn: googleProductsApi.connectProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-product-connections"] });
    },
  });
}

export function useUpdateGoogleProductConnection() {
  const queryClient = useQueryClient();
  return useMutation<GoogleProductConnection, Error, { id: string; data: Partial<GoogleProductConnection> }>({
    mutationFn: ({ id, data }) => googleProductsApi.updateConnection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-product-connections"] });
    },
  });
}

export function useDeleteGoogleProductConnection() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: googleProductsApi.deleteConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-product-connections"] });
    },
  });
}

export function useSyncGoogleProduct(connId: string) {
  const queryClient = useQueryClient();
  return useMutation<GoogleProductConnection, Error, string>({
    mutationFn: googleProductsApi.syncConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["google-product-connections"] });
    },
  });
}

export function useGtmVariables(connId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: TagManagerVariable[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["gtm-variables", connId, params],
    queryFn: () => googleProductsApi.listGtmVariables(connId, params),
    enabled: !!connId,
  });
}

export function useGtmTriggers(connId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: TagManagerTrigger[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["gtm-triggers", connId, params],
    queryFn: () => googleProductsApi.listGtmTriggers(connId, params),
    enabled: !!connId,
  });
}

export function useGtmTags(connId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: TagManagerTag[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["gtm-tags", connId, params],
    queryFn: () => googleProductsApi.listGtmTags(connId, params),
    enabled: !!connId,
  });
}

export function useAdsAccounts(connId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: GoogleAdsAccount[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["ads-accounts", connId, params],
    queryFn: () => googleProductsApi.listAdsAccounts(connId, params),
    enabled: !!connId,
  });
}

export function useAdSenseAccounts(connId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: AdSenseAccount[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["adsense-accounts", connId, params],
    queryFn: () => googleProductsApi.listAdSenseAccounts(connId, params),
    enabled: !!connId,
  });
}

export function useTrendsQueries(connId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: TrendsQuery[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["trends-queries", connId, params],
    queryFn: () => googleProductsApi.listTrendsQueries(connId, params),
    enabled: !!connId,
  });
}