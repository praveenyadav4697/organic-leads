import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/providers")({
  head: () => ({ meta: [{ title: "Tracking Providers — Nebula" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Tracking Providers</div>
        <p className="text-sm text-muted-foreground">Manage and verify tracking integrations across all platforms.</p>
      </div>
    </div>
  ),
});