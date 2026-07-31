import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/contact-forms")({
  head: () => ({ meta: [{ title: "Contact Forms — Nebula" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Contact Forms</div>
        <p className="text-sm text-muted-foreground">Configure and manage contact forms with validation and spam protection.</p>
      </div>
    </div>
  ),
});