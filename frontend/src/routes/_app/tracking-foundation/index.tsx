import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, OverviewDashboard } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/")({
  head: () => ({ meta: [{ title: "Tracking Foundation | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Tracking Foundation">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <OverviewDashboard />
      </div>
    </ErrorBoundary>
  ),
});