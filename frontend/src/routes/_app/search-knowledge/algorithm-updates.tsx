import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/feedback";
import {
  ApprovalBadge,
  AlgorithmStatusBadge,
  DateCell,
  DocLink,
  PriorityBadge,
  SearchLandscapeNav,
  TableCard,
} from "@/modules/search-landscape/components";
import { useAlgorithms, useApproveItem } from "@/hooks/useSearchLandscape";

export const Route = createFileRoute("/_app/search-knowledge/algorithm-updates")({
  head: () => ({ meta: [{ title: "Algorithm Updates | Organic Leads" }] }),
  component: AlgorithmUpdatesPage,
});

function AlgorithmUpdatesPage() {
  const query = useAlgorithms();
  const approve = useApproveItem();

  return (
    <div>
      <PageHeader
        eyebrow="F03 · Search Landscape Knowledge"
        title="Algorithm Updates"
        description="History of search algorithm updates. Interpretations require manual approval before publishing."
      />
      <SearchLandscapeNav />

      {query.isPending ? (
        <LoadingState message="Loading algorithm updates…" />
      ) : query.isError || !query.data ? (
        <EmptyState title="No data available" description="Run a sync to populate the algorithm update history." />
      ) : query.data.length === 0 ? (
        <EmptyState title="No data available" description="Run a sync to populate the algorithm update history." />
      ) : (
        <TableCard title={`${query.data.length} updates`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">Update Name</th>
                <th className="text-left px-3 py-2.5 font-medium">Release Date</th>
                <th className="text-left px-3 py-2.5 font-medium">Status</th>
                <th className="text-left px-3 py-2.5 font-medium">Summary</th>
                <th className="text-left px-3 py-2.5 font-medium">Priority</th>
                <th className="text-left px-3 py-2.5 font-medium">Documentation</th>
                <th className="text-left px-3 py-2.5 font-medium">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition align-top">
                  <td className="px-3 py-3 font-medium whitespace-nowrap">{a.name}</td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    <DateCell value={a.release_date} />
                  </td>
                  <td className="px-3 py-3">
                    <AlgorithmStatusBadge value={a.status} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground max-w-md">{a.summary}</td>
                  <td className="px-3 py-3">
                    <PriorityBadge value={a.priority} />
                  </td>
                  <td className="px-3 py-3">
                    <DocLink url={a.documentation_url} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {a.approval_status === "pending" ? (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-success"
                          onClick={() => approve.mutate({ entityType: "algorithms", id: a.id, approved: true })}
                          disabled={approve.isPending}
                        >
                          <Check className="size-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-destructive"
                          onClick={() => approve.mutate({ entityType: "algorithms", id: a.id, approved: false })}
                          disabled={approve.isPending}
                        >
                          <X className="size-3" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <ApprovalBadge value={a.approval_status} />
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
