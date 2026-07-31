import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/submissions")({
  head: () => ({ meta: [{ title: "Submissions — Nebula" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Submissions</div>
        <p className="text-sm text-muted-foreground">View and manage form submissions with UTM data and consent logs.</p>
      </div>
    </div>
  ),
});