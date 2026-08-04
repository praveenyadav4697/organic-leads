import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingState } from "@/components/feedback";
import { DateCell, DocLink, SearchLandscapeNav, TableCard } from "@/modules/search-landscape/components";
import { useDocumentation } from "@/hooks/useSearchLandscape";

export const Route = createFileRoute("/_app/search-knowledge/documentation")({
  head: () => ({ meta: [{ title: "Documentation | Organic Leads" }] }),
  component: DocumentationPage,
});

function DocumentationPage() {
  const query = useDocumentation();

  return (
    <div>
      <PageHeader
        eyebrow="F03 · Search Landscape Knowledge"
        title="Documentation"
        description="Official search-engine documentation sources tracked for version and last review."
      />
      <SearchLandscapeNav />

      {query.isPending ? (
        <LoadingState message="Loading documentation…" />
      ) : query.isError || !query.data ? (
        <EmptyState title="No data available" description="Run a sync to register documentation sources." />
      ) : query.data.length === 0 ? (
        <EmptyState title="No data available" description="Run a sync to register documentation sources." />
      ) : (
        <TableCard title={`${query.data.length} sources`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">Title</th>
                <th className="text-left px-3 py-2.5 font-medium">Category</th>
                <th className="text-left px-3 py-2.5 font-medium">Source URL</th>
                <th className="text-left px-3 py-2.5 font-medium">Version</th>
                <th className="text-left px-3 py-2.5 font-medium">Last Synced</th>
                <th className="text-left px-3 py-2.5 font-medium">Last Reviewed</th>
                <th className="text-left px-3 py-2.5 font-medium">Retries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition align-top">
                  <td className="px-3 py-3 font-medium">{s.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{s.category ?? "—"}</td>
                  <td className="px-3 py-3">
                    <DocLink url={s.url} label="Source" />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">v{s.version}</td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    <DateCell value={s.last_synced} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    <DateCell value={s.last_reviewed} />
                  </td>
                  <td className="px-3 py-3">
                    {s.retry_count > 0 ? (
                      <Badge className="border-warning/30 bg-warning/10 text-warning-foreground">
                        {s.retry_count}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
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
