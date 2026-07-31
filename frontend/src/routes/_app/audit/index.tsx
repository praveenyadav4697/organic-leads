import { createFileRoute } from "@tanstack/react-router";
import AuditDashboard from "@/pages/AuditDashboard";

export const Route = createFileRoute("/_app/audit/")({
  component: AuditDashboard,
});