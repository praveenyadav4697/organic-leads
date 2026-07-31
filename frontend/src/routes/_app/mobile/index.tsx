import { createFileRoute } from "@tanstack/react-router";
import MobileDashboard from "@/pages/MobileDashboard";

export const Route = createFileRoute("/_app/mobile/")({
  component: MobileDashboard,
});