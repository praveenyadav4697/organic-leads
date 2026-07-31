import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/consent")({
  head: () => ({ meta: [{ title: "Consent Management | Organic Leads" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Consent Management</div>
        <p className="text-sm text-muted-foreground">Manage consent wording, preferences, and compliance logs.</p>
      </div>
    </div>
  ),
});