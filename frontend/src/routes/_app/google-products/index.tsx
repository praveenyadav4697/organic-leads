import { createFileRoute } from "@tanstack/react-router";
import GoogleProductsDashboard from "@/pages/GoogleProductsDashboard";

export const Route = createFileRoute("/_app/google-products/")({
  component: GoogleProductsDashboard,
});