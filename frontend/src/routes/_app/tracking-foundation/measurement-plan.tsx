import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, MeasurementPlanManager } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/measurement-plan")({
  head: () => ({ meta: [{ title: "Measurement Plan | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Measurement Plan">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <MeasurementPlanManager />
      </div>
    </ErrorBoundary>
  ),
});
