import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { EmptyState, LoadingState } from "@/components/feedback";
import { SearchLandscapeNav, SupportedBadge, TableCard, DateCell, DocLink } from "@/modules/search-landscape/components";
import { useSerpFeatures } from "@/hooks/useSearchLandscape";

export const Route = createFileRoute("/_app/search-knowledge/serp-features")({
  head: () => ({ meta: [{ title: "SERP Features | Organic Leads" }] }),
  component: SerpFeaturesPage,
});

function SerpFeaturesPage() {
  const query = useSerpFeatures();

  return (
    <div>
      <PageHeader
        eyebrow="F03 · Search Landscape Knowledge"
        title="SERP Features"
        description="Catalog of search result page features — when they appear and where they are documented."
      />
      <SearchLandscapeNav />

      {query.isPending ? (
        <LoadingState message="Loading SERP features…" />
      ) : query.isError || !query.data ? (
        <EmptyState title="No data available" description="Run a sync to populate the SERP feature catalog." />
      ) : query.data.length === 0 ? (
        <EmptyState title="No data available" description="Run a sync to populate the SERP feature catalog." />
      ) : (
        <TableCard title={`${query.data.length} features`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">Feature</th>
                <th className="text-left px-3 py-2.5 font-medium">Description</th>
                <th className="text-left px-3 py-2.5 font-medium">Supported</th>
                <th className="text-left px-3 py-2.5 font-medium">Documentation</th>
                <th className="text-left px-3 py-2.5 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.map((f) => (
                <tr key={f.id} className="hover:bg-muted/30 transition align-top">
                  <td className="px-3 py-3 font-medium whitespace-nowrap">{f.name}</td>
                  <td className="px-3 py-3 text-muted-foreground max-w-xl">{f.description}</td>
                  <td className="px-3 py-3">
                    <SupportedBadge value={f.supported} />
                  </td>
                  <td className="px-3 py-3">
                    <DocLink url={f.documentation_url} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    <DateCell value={f.updated_at} />
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
