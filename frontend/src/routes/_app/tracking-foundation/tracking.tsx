import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, TrackingScriptsTable } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/tracking")({
  head: () => ({ meta: [{ title: "Tracking Scripts | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Tracking Scripts">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <TrackingScriptsTable />
      </div>
    </ErrorBoundary>
  ),
});