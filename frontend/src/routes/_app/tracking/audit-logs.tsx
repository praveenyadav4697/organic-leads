import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs | Organic Leads" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Audit Logs</div>
        <p className="text-sm text-muted-foreground">Track all tracking changes, consent changes, form changes, verifications, and approvals.</p>
      </div>
    </div>
  ),
});