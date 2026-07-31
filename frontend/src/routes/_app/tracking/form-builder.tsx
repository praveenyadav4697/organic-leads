import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/form-builder")({
  head: () => ({ meta: [{ title: "Form Builder — Nebula" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Form Builder</div>
        <p className="text-sm text-muted-foreground">Build and configure contact forms with dynamic fields and conditional logic.</p>
      </div>
    </div>
  ),
});