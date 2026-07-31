import { createFileRoute } from "@tanstack/react-router";
import { BusinessKeywordCompetitorDashboard } from "@/pages/BusinessKeywordCompetitorDashboard";

export const Route = createFileRoute("/_app/business-keyword-competitor/")({
  head: () => ({ meta: [{ title: "Business, Keyword & Competitor Intelligence | Organic Leads" }] }),
  component: BusinessKeywordCompetitorDashboard,
});