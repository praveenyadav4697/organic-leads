import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/settings")({
  head: () => ({ meta: [{ title: "Settings | Organic Leads" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Settings</div>
        <p className="text-sm text-muted-foreground">Configure tracking defaults, global settings, and module preferences.</p>
      </div>
    </div>
  ),
});