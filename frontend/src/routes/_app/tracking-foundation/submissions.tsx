import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { FormSubmissionsTable, TrackingFoundationNav } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/submissions")({
  head: () => ({ meta: [{ title: "Submissions | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Submissions">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <FormSubmissionsTable />
      </div>
    </ErrorBoundary>
  ),
});
