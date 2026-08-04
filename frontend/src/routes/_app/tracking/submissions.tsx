import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav, FormSubmissionsTable } from "@/modules/tracking/components";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";

export const Route = createFileRoute("/_app/tracking/submissions")({
  head: () => ({ meta: [{ title: "Submissions | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Submissions">
      <div className="space-y-6">
        <TrackingNav />
        <FormSubmissionsTable />
      </div>
    </ErrorBoundary>
  ),
});