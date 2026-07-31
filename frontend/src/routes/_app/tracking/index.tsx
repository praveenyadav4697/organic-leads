import { createFileRoute } from "@tanstack/react-router";
import { TrackingPage, TrackingNav, TrackingStats, TrackingDashboard } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/")({
  head: () => ({ meta: [{ title: "Tracking Center | Organic Leads" }] }),
  component: TrackingPage,
});