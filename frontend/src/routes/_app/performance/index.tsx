import { createFileRoute } from "@tanstack/react-router";
import PerformanceDashboard from "@/pages/PerformanceDashboard";

export const Route = createFileRoute("/_app/performance/")({
  component: PerformanceDashboard,
});