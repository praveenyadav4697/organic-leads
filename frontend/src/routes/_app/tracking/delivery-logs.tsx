import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/delivery-logs")({
  head: () => ({ meta: [{ title: "Delivery Logs — Nebula" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Delivery Logs</div>
        <p className="text-sm text-muted-foreground">Monitor email, webhook, Slack, Teams, CRM, and queue delivery status.</p>
      </div>
    </div>
  ),
});