import { createFileRoute } from "@tanstack/react-router";
import SeoDashboard from "@/pages/SeoDashboard";

export const Route = createFileRoute("/_app/seo/")({
  component: SeoDashboard,
});