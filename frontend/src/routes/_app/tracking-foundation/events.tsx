import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, EventTestingPanel } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/events")({
  head: () => ({ meta: [{ title: "Event Testing | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Event Testing">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <EventTestingPanel />
      </div>
    </ErrorBoundary>
  ),
});