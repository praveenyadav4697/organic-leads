import { createFileRoute } from "@tanstack/react-router";
import { OnPageSEODashboard } from "@/pages/OnPageSEODashboard";

export const Route = createFileRoute("/_app/onpage-seo/")({
  head: () => ({ meta: [{ title: "On-Page SEO Engine | Organic Leads" }] }),
  component: OnPageSEODashboard,
});