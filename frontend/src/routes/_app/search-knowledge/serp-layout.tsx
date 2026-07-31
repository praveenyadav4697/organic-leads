import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/serp-layout")({
  head: () => ({ meta: [{ title: "SERP Layout | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="SERP Layout"
      description="The anatomy of a modern Google results page — paid placements, organic blocks, AI overlays, and rich modules."
      summary="The 2026 SERP is a layered mosaic: paid units on top and bottom, AI overview + organic ten-blue-links in the middle, and rich modules (PAA, images, video, shopping) scattered throughout. Each block has its own ranking system and CTR profile."
      sections={[
        {
          kind: "table",
          title: "Vertical blocks (top to bottom)",
          columns: ["Block", "Type", "Avg. CTR", "Notes"],
          rows: [
            ["Sponsored Carousel", "Paid", "8–14%", "Always above the fold on commercial queries."],
            ["AI Overview", "GenAI", "—", "Citations within block steal downstream CTR."],
            ["Featured Snippet", "Organic", "35–45%", "Position-zero captures most clicks."],
            ["Local Pack", "Local", "24–32%", "Drives calls, directions, and store visits."],
            ["Organic Results", "Organic", "—", "Top-3 still captures ~75% of remaining clicks."],
            ["People Also Ask", "Organic", "—", "Each answer expands into its own SERP."],
            ["Image / Video", "Rich", "—", "Pulls visual content into the linear flow."],
            ["Shopping", "Paid / Free", "—", "Free listings now dominate e-commerce SERPs."],
            ["Sponsored Bottom", "Paid", "—", "Lower visibility, lower CPC."],
          ],
        },
        {
          kind: "cards",
          title: "Key UX modules",
          items: [
            { title: "Knowledge Panel", description: "Right-side entity summary for brands, people, places." },
            { title: "Sitelinks", description: "Sub-page shortcuts shown for navigational queries." },
            { title: "Reviews", description: "Star ratings pulled from structured data and approved sources." },
            { title: "FAQ Dropdowns", description: "Expandable Q&A blocks — now part of standard PAA." },
          ],
        },
        {
          kind: "list",
          title: "Design implications",
          items: [
            "The top of the SERP is no longer just text — it's a layout grid.",
            "PAA expansion can shift the effective position of #1 organic by 400px+.",
            "Zero-click queries exceed 65% for informational terms — design for visibility, not just traffic.",
            "Visual SERP features (Images, Videos) require their own optimization tracks.",
          ],
        },
      ]}
      bestPractices={[
        "Target featured snippet position for high-volume informational queries.",
        "Implement Product + Review + FAQ schema to unlock shopping and rich modules.",
        "Track CTR per SERP feature, not just per URL — clicks-per-impression varies 5× by feature.",
        "Use AI Overview citation tracking to monitor how your content is referenced.",
      ]}
      examples={[
        { query: "\"best running shoes\" SERP", result: "AI overview → shopping carousel → PAA → organic review roundup." },
        { query: "weather new york", result: "Knowledge card with live forecast dominates — zero organic links shown." },
      ]}
    />
  );
}