import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, RoutingDestinationsTable } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/routing")({
  head: () => ({ meta: [{ title: "Routing Destinations | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Routing Destinations">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <RoutingDestinationsTable />
      </div>
    </ErrorBoundary>
  ),
});