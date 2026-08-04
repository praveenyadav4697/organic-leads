import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/feedback";
import { SearchLandscapeNav, SupportedBadge, TableCard } from "@/modules/search-landscape/components";
import { useOperators } from "@/hooks/useSearchLandscape";

export const Route = createFileRoute("/_app/search-knowledge/search-operators")({
  head: () => ({ meta: [{ title: "Search Operators | Organic Leads" }] }),
  component: SearchOperatorsPage,
});

function SearchOperatorsPage() {
  const query = useOperators();

  return (
    <div>
      <PageHeader
        eyebrow="F03 · Search Landscape Knowledge"
        title="Search Operators"
        description="Normalized search operator library — how each operator filters results and where it is supported."
      />
      <SearchLandscapeNav />

      {query.isPending ? (
        <LoadingState message="Loading search operators…" />
      ) : query.isError || !query.data ? (
        <EmptyState title="No data available" description="Run a sync to populate the search operator library." />
      ) : query.data.length === 0 ? (
        <EmptyState title="No data available" description="Run a sync to populate the search operator library." />
      ) : (
        <TableCard title={`${query.data.length} operators`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">Operator</th>
                <th className="text-left px-3 py-2.5 font-medium">Purpose</th>
                <th className="text-left px-3 py-2.5 font-medium">Example</th>
                <th className="text-left px-3 py-2.5 font-medium">Supported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition align-top">
                  <td className="px-3 py-3">
                    <code className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono text-primary">{o.operator}</code>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground max-w-md">{o.purpose}</td>
                  <td className="px-3 py-3 font-mono text-xs">{o.example}</td>
                  <td className="px-3 py-3">
                    <SupportedBadge value={o.supported} />
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
