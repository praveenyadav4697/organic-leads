import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/verification")({
  head: () => ({ meta: [{ title: "Tracking Verification | Organic Leads" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Tracking Verification</div>
        <p className="text-sm text-muted-foreground">Verify tracking codes and integrations are firing correctly.</p>
      </div>
    </div>
  ),
});