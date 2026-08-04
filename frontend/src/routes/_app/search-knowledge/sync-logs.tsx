import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/feedback";
import { SearchLandscapeNav, TableCard } from "@/modules/search-landscape/components";
import { useSyncLogs } from "@/hooks/useSearchLandscape";

function SyncStatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    success: "border-success/30 bg-success/10 text-success",
    partial: "border-warning/30 bg-warning/10 text-warning-foreground",
    failed: "border-destructive/30 bg-destructive/10 text-destructive",
    running: "border-primary/30 bg-primary/10 text-primary",
  };
  return <Badge className={map[value] ?? "border-border bg-muted/40 text-muted-foreground"}>{value}</Badge>;
}

export const Route = createFileRoute("/_app/search-knowledge/sync-logs")({
  head: () => ({ meta: [{ title: "Sync Logs | Organic Leads" }] }),
  component: SyncLogsPage,
});

function SyncLogsPage() {
  const query = useSyncLogs();

  return (
    <div>
      <PageHeader
        eyebrow="F03 · Search Landscape Knowledge"
        title="Sync Logs"
        description="Sync runs with correlation id, retry count and error details. Failed fetches keep the last approved version."
      />
      <SearchLandscapeNav />

      {query.isPending ? (
        <LoadingState message="Loading sync logs…" />
      ) : query.isError || !query.data ? (
        <EmptyState title="No data available" description="Run a sync to generate sync history." />
      ) : query.data.length === 0 ? (
        <EmptyState title="No data available" description="Run a sync to generate sync history." />
      ) : (
        <TableCard title={`${query.data.length} runs`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">Correlation ID</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                <th className="text-left px-3 py-2.5 font-medium">Started</th>
                <th className="text-left px-3 py-2.5 font-medium">Duration</th>
                <th className="text-left px-3 py-2.5 font-medium">Retries</th>
                <th className="text-left px-3 py-2.5 font-medium">Created</th>
                <th className="text-left px-3 py-2.5 font-medium">Updated</th>
                <th className="text-left px-3 py-2.5 font-medium">Triggered By</th>
                <th className="text-left px-3 py-2.5 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition align-top">
                  <td className="px-3 py-3 font-mono text-xs">{s.correlation_id}</td>
                  <td className="px-3 py-3">
                    <SyncStatusBadge value={s.status} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {s.started_at ? new Date(s.started_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {s.duration_seconds != null ? `${s.duration_seconds.toFixed(1)}s` : "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{s.retry_count}</td>
                  <td className="px-3 py-3 text-muted-foreground">{s.items_created}</td>
                  <td className="px-3 py-3 text-muted-foreground">{s.items_updated}</td>
                  <td className="px-3 py-3 text-muted-foreground">{s.triggered_by ?? "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground max-w-xs truncate">{s.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}
