import { createFileRoute } from "@tanstack/react-router";
import BusinessDashboard from "@/pages/BusinessDashboard";

export const Route = createFileRoute("/_app/business/")({
  component: BusinessDashboard,
});