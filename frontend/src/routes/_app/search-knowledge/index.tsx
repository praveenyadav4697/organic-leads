import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Globe2, Radar, RefreshCw, ShieldAlert, Sparkles, Timer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageLoading } from "@/components/feedback";
import {
  SearchLandscapeNav,
  StatCard,
} from "@/modules/search-landscape/components";
import { useSearchLandscapeOverview, useSyncLandscape } from "@/hooks/useSearchLandscape";

export const Route = createFileRoute("/_app/search-knowledge/")({
  head: () => ({ meta: [{ title: "F03 Search Landscape | Organic Leads" }] }),
  component: OverviewPage,
});

function OverviewPage() {
  const overview = useSearchLandscapeOverview();
  const sync = useSyncLandscape();

  if (overview.isPending) {
    return (
      <div>
        <PageHeader eyebrow="F03 · Search Landscape Knowledge" title="Overview" description="Loading overview…" />
        <SearchLandscapeNav />
        <PageLoading title="Loading overview" description="Fetching search landscape stats…" />
      </div>
    );
  }

  if (overview.isError || !overview.data) {
    return (
      <div>
        <PageHeader eyebrow="F03 · Search Landscape Knowledge" title="Overview" description="Governed search knowledge repository." />
        <SearchLandscapeNav />
        <EmptyState
          title="No data available"
          description="The search landscape service is unavailable. Start the backend and try syncing."
        />
      </div>
    );
  }

  const stats = overview.data;

  return (
    <div>
      <PageHeader
        eyebrow="F03 · Search Landscape Knowledge"
        title="Overview"
        description="A governed, versioned repository of search-engine knowledge consumed by F04–F08. No SEO scoring — only maintained search knowledge."
        actions={
          <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
            <RefreshCw className={sync.isPending ? "size-4 animate-spin" : "size-4"} />
            {sync.isPending ? "Syncing…" : "Sync Now"}
          </Button>
        }
      />
      <SearchLandscapeNav />

      {sync.isSuccess && (
        <Card className="mb-6 p-4 border-success/30 bg-success/5 text-sm">
          Sync complete — {sync.data.items_created} created, {sync.data.items_updated} updated
          (correlation {sync.data.correlation_id}).
        </Card>
      )}
      {sync.isError && (
        <Card className="mb-6 p-4 border-destructive/30 bg-destructive/5 text-sm text-destructive">
          Sync failed: {(sync.error as Error).message ?? "Unknown error"}. Prior approved knowledge was kept.
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Knowledge Version" value={stats.knowledge_version ?? "—"} icon={BookOpen} />
        <StatCard label="Last Sync" value={stats.last_sync ? new Date(stats.last_sync).toLocaleDateString() : "—"} icon={Timer} />
        <StatCard label="Last Update" value={stats.last_update ? new Date(stats.last_update).toLocaleDateString() : "—"} icon={RefreshCw} />
        <StatCard label="Total Search Rules" value={stats.total_search_rules} icon={BookOpen} />
        <StatCard label="Total SERP Features" value={stats.total_serp_features} icon={Sparkles} />
        <StatCard label="Algorithm Updates" value={stats.algorithm_updates} icon={Radar} />
        <StatCard label="Pending Approvals" value={stats.pending_approvals} icon={ShieldAlert} />
        <StatCard label="Documentation Sources" value={stats.sources} icon={BookOpen} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Globe2 className="size-4 text-primary" /> Supported Search Engines
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.supported_engines.map((e) => (
              <span key={e} className="rounded-lg border border-border bg-muted/30 px-3 py-1 text-xs">
                {e}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Sparkles className="size-4 text-primary" /> Supported Markets
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.markets.map((m) => (
              <span key={m} className="rounded-lg border border-border bg-muted/30 px-3 py-1 text-xs">
                {m}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Timer className="size-4 text-primary" /> Supported Devices
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.devices.map((d) => (
              <span key={d} className="rounded-lg border border-border bg-muted/30 px-3 py-1 text-xs">
                {d}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
