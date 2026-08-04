import { createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";
import { TrackingFoundationNav, AuditLogsTable } from "@/modules/tracking-foundation/components";

export const Route = createFileRoute("/_app/tracking-foundation/audit")({
  head: () => ({ meta: [{ title: "Audit Logs | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Audit Logs">
      <div className="space-y-6">
        <TrackingFoundationNav />
        <AuditLogsTable />
      </div>
    </ErrorBoundary>
  ),
});