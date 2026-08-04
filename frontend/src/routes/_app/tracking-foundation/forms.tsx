import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, FormsDiscoveryTable } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/forms")({
  head: () => ({ meta: [{ title: "Forms Discovery | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Forms Discovery">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <FormsDiscoveryTable />
      </div>
    </ErrorBoundary>
  ),
});