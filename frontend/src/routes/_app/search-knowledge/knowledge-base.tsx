import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/feedback";
import {
  ApprovalBadge,
  DateCell,
  PriorityBadge,
  SearchLandscapeNav,
  TableCard,
} from "@/modules/search-landscape/components";
import { useApproveItem, useKnowledge } from "@/hooks/useSearchLandscape";

const CATEGORY_LABELS: Record<string, string> = {
  ranking_signals: "Ranking Signals",
  indexing_rules: "Indexing Rules",
  crawling_rules: "Crawling Rules",
  structured_data: "Structured Data",
  search_architecture: "Search Architecture",
  algorithm_knowledge: "Algorithm Knowledge",
};

export const Route = createFileRoute("/_app/search-knowledge/knowledge-base")({
  head: () => ({ meta: [{ title: "Knowledge Base | Organic Leads" }] }),
  component: KnowledgeBasePage,
});

function KnowledgeBasePage() {
  const query = useKnowledge();
  const approve = useApproveItem();

  return (
    <div>
      <PageHeader
        eyebrow="F03 · Search Landscape Knowledge"
        title="Knowledge Base"
        description="Governed search knowledge — ranking signals, indexing, crawling rules, structured data and architecture. Interpretations require manual approval."
      />
      <SearchLandscapeNav />

      {query.isPending ? (
        <LoadingState message="Loading knowledge base…" />
      ) : query.isError || !query.data ? (
        <EmptyState title="No data available" description="Run a sync to populate the knowledge base." />
      ) : query.data.length === 0 ? (
        <EmptyState title="No data available" description="Run a sync to populate the knowledge base." />
      ) : (
        <TableCard title={`${query.data.length} items`}>
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2.5 font-medium">Category</th>
                <th className="text-left px-3 py-2.5 font-medium">Title</th>
                <th className="text-left px-3 py-2.5 font-medium">Version</th>
                <th className="text-left px-3 py-2.5 font-medium">Priority</th>
                <th className="text-left px-3 py-2.5 font-medium">Source</th>
                <th className="text-left px-3 py-2.5 font-medium">Updated</th>
                <th className="text-left px-3 py-2.5 font-medium">Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.map((k) => (
                <tr key={k.id} className="hover:bg-muted/30 transition align-top">
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                    {CATEGORY_LABELS[k.category] ?? k.category}
                  </td>
                  <td className="px-3 py-3 max-w-md">
                    <div className="font-medium">{k.title}</div>
                    {k.summary && <div className="text-xs text-muted-foreground mt-1">{k.summary}</div>}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">v{k.version}</td>
                  <td className="px-3 py-3">
                    <PriorityBadge value={k.priority} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{k.source ?? "—"}</td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    <DateCell value={k.updated_at} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {k.approval_status === "pending" && k.requires_approval ? (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-success"
                          onClick={() => approve.mutate({ entityType: "knowledge", id: k.id, approved: true })}
                          disabled={approve.isPending}
                        >
                          <Check className="size-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-destructive"
                          onClick={() => approve.mutate({ entityType: "knowledge", id: k.id, approved: false })}
                          disabled={approve.isPending}
                        >
                          <X className="size-3" /> Reject
                        </Button>
                      </div>
                    ) : (
                      <ApprovalBadge value={k.approval_status} />
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
