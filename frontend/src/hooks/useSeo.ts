import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { seoApi } from "@/modules/seo/services";
import type {
  WebPage,
  PageIssue,
  InternalLink,
  SchemaMarkup,
  PageAuditResult,
} from "@/modules/seo/types";

export function useSeoPages(params?: {
  foundation_project_id?: string;
  page_status?: string;
  optimization_status?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<{
    items: WebPage[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["seo-pages", params],
    queryFn: () => seoApi.listPages(params),
  });
}

export function useSeoPage(pageId: string | null) {
  return useQuery<WebPage>({
    queryKey: ["seo-page", pageId],
    queryFn: () => seoApi.getPage(pageId!),
    enabled: !!pageId,
  });
}

export function useSeoPageByUrl(url: string) {
  return useQuery<WebPage>({
    queryKey: ["seo-page-by-url", url],
    queryFn: () => seoApi.getPageByUrl(url),
    enabled: !!url,
  });
}

export function useCreateSeoPage() {
  const queryClient = useQueryClient();
  return useMutation<WebPage, Error, { url: string; foundation_project_id?: string }>({
    mutationFn: seoApi.createPage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-pages"] });
    },
  });
}

export function useUpdateSeoPage() {
  const queryClient = useQueryClient();
  return useMutation<WebPage, Error, { id: string; data: Partial<WebPage> }>({
    mutationFn: ({ id, data }) => seoApi.updatePage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-pages"] });
    },
  });
}

export function useDeleteSeoPage() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: seoApi.deletePage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-pages"] });
    },
  });
}

export function usePageIssues(webPageId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: PageIssue[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["page-issues", webPageId, params],
    queryFn: () => seoApi.listIssues(webPageId, params),
    enabled: !!webPageId,
  });
}

export function useCreatePageIssue() {
  const queryClient = useQueryClient();
  return useMutation<PageIssue, Error, { webPageId: string; data: { issue_type: string; severity: string; title: string } }>({
    mutationFn: ({ webPageId, data }) => seoApi.createIssue(webPageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-issues"] });
    },
  });
}

export function useFixPageIssue() {
  const queryClient = useQueryClient();
  return useMutation<PageIssue, Error, string>({
    mutationFn: seoApi.fixIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-issues"] });
    },
  });
}

export function useInternalLinks(sourcePageId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: InternalLink[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["internal-links", sourcePageId, params],
    queryFn: () => seoApi.listInternalLinks(sourcePageId, params),
    enabled: !!sourcePageId,
  });
}

export function useCreateInternalLink() {
  const queryClient = useQueryClient();
  return useMutation<InternalLink, Error, { sourcePageId: string; data: { target_page_id?: string; target_url?: string; anchor_text?: string; link_type: string; dofollow: boolean } }>({
    mutationFn: ({ sourcePageId, data }) => seoApi.createInternalLink(sourcePageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internal-links"] });
    },
  });
}

export function useSchemaMarkup(webPageId: string, params?: { page?: number; page_size?: number }) {
  return useQuery<{
    items: SchemaMarkup[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }>({
    queryKey: ["schema-markup", webPageId, params],
    queryFn: () => seoApi.listSchemaMarkup(webPageId, params),
    enabled: !!webPageId,
  });
}

export function useCreateSchemaMarkup() {
  const queryClient = useQueryClient();
  return useMutation<SchemaMarkup, Error, { webPageId: string; data: { schema_type: string; schema_json?: Record<string, unknown> } }>({
    mutationFn: ({ webPageId, data }) => seoApi.createSchemaMarkup(webPageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schema-markup"] });
    },
  });
}

export function useRunPageAudit() {
  const queryClient = useQueryClient();
  return useMutation<PageAuditResult, Error, { foundation_project_id?: string; urls: string[] }>({
    mutationFn: seoApi.runPageAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seo-pages"] });
    },
  });
}