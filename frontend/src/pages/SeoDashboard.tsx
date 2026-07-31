import { useState } from "react";
import { useSeoPages } from "@/hooks/useSeo";
import { useCreateSeoPage } from "@/hooks/useSeo";
import { useDeleteSeoPage } from "@/hooks/useSeo";
import { SeoPageCard } from "@/components/seo/page-card";
import { SeoPageDialog } from "@/components/seo/page-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, RefreshCw } from "lucide-react";

function SeoDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useSeoPages({
    page,
    page_size: 10,
  });

  const createPage = useCreateSeoPage({
    onSuccess: () => {
      toast.success("Page added");
      setDialogOpen(false);
      refetch();
    },
    onError: () => toast.error("Failed to add page"),
  });

  const deletePage = useDeleteSeoPage({
    onSuccess: () => toast.success("Page deleted"),
    onError: () => toast.error("Failed to delete page"),
  });

  const filteredPages = (data?.items ?? []).filter(
    (p) => p.url.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-destructive mb-4">Failed to load pages</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">On-Page SEO</h1>
          <p className="text-sm text-muted-foreground">
            Manage your website page inventory and optimization status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="size-3" /> Refresh
          </Button>
          <SeoPageDialog onSubmit={(data) => createPage.mutate(data)}>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="size-3" /> Add Page
            </Button>
          </SeoPageDialog>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search pages by URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredPages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No pages found.</p>
          <p className="text-xs mt-1">Add a page URL to start your SEO inventory.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPages.map((page) => (
            <SeoPageCard
              key={page.id}
              page={page}
              onDelete={deletePage.mutate}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredPages.length} of {data?.total ?? 0} pages
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="px-2 py-1 text-xs">Page {page} of {data?.total_pages ?? 1}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.total_pages ?? 1)} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SeoDashboard;