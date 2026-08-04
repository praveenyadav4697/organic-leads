import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, ValidationReportTable } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/validation")({
  head: () => ({ meta: [{ title: "Validation Report | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Validation Report">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <ValidationReportTable />
      </div>
    </ErrorBoundary>
  ),
});