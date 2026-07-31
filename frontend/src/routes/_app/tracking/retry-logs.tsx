import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/retry-logs")({
  head: () => ({ meta: [{ title: "Retry Logs | Organic Leads" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Retry Logs</div>
        <p className="text-sm text-muted-foreground">Track retry attempts for failed deliveries with configurable backoff.</p>
      </div>
    </div>
  ),
});