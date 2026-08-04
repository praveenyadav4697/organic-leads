import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/feedback";
import {
  ApprovalBadge,
  DateCell,
  SearchLandscapeNav,
  TableCard,
} from "@/modules/search-landscape/components";
import { useVersions } from "@/hooks/useSearchLandscape";

const ENTITY_LABELS: Record<string, string> = {
  serp_feature: "SERP Feature",
  algorithm_update: "Algorithm Update",
  search_operator: "Search Operator",
  knowledge: "Knowledge",
};

export const Route = createFileRoute("/_app/search-knowledge/versions")({
  head: () => ({ meta: [{ title: "Versions | Organic Leads" }] }),
  component: VersionsPage,
});

function VersionsPage() {
  const query = useVersions();

  return (
    <div>
      <PageHeader
        eyebrow="F03 · Search Landscape Knowledge"
        title="Versions"
        description="Version history and source traceability for every imported knowledge item."
      />
      <SearchLandscapeNav />

      {query.isPending ? (
        <LoadingState message="Loading version history…" />
      ) : query.isError || !query.data ? (
        <EmptyState title="No data available" description="Run a sync to generate version history." />
      ) : query.data.length === 0 ? (
        <EmptyState title="No data available" description="Run a sync to generate version history." />
      ) : (
        <TableCard title={`${query.data.length} versions`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">Entity</th>
                <th className="text-left px-3 py-2.5 font-medium">Version</th>
                <th className="text-left px-3 py-2.5 font-medium">Change Summary</th>
                <th className="text-left px-3 py-2.5 font-medium">Approval</th>
                <th className="text-left px-3 py-2.5 font-medium">Source</th>
                <th className="text-left px-3 py-2.5 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition align-top">
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-medium">{ENTITY_LABELS[v.entity_type] ?? v.entity_type}</span>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">{v.entity_id}</div>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">v{v.version}</td>
                  <td className="px-3 py-3 text-muted-foreground max-w-md">{v.change_summary ?? "—"}</td>
                  <td className="px-3 py-3">
                    <ApprovalBadge value={v.approval_status} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{v.source ?? "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    <DateCell value={v.created_at} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  );
}
