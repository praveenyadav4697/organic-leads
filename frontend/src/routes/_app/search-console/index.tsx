import { createFileRoute } from "@tanstack/react-router";
import SearchConsoleDashboard from "@/pages/SearchConsoleDashboard";

export const Route = createFileRoute("/_app/search-console/")({
  component: SearchConsoleDashboard,
});