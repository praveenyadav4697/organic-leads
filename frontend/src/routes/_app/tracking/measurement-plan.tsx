import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/measurement-plan")({
  head: () => ({ meta: [{ title: "Measurement Plan | Organic Leads" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Measurement Plan</div>
        <p className="text-sm text-muted-foreground">Define the business context, objectives, channels, frequency and ownership for measurement.</p>
      </div>
    </div>
  ),
});