import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, ConsentConfigurationPanel } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/consent")({
  head: () => ({ meta: [{ title: "Consent Configuration | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Consent Configuration">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <ConsentConfigurationPanel />
      </div>
    </ErrorBoundary>
  ),
});