import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/approvals")({
  head: () => ({ meta: [{ title: "Approval Center | Organic Leads" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Approval Center</div>
        <p className="text-sm text-muted-foreground">Review and approve consent wording, tracking IDs, event definitions, and routing rules.</p>
      </div>
    </div>
  ),
});