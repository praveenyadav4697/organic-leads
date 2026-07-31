import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/local-search")({
  head: () => ({ meta: [{ title: "Local Search | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Local Search"
      description="The map pack, Google Business Profile, and the signals that win nearby intent."
      summary="Local search is Google's most profitable unit. The map pack owns the top fold for any 'near me' or geo-qualified query. Win by aligning your GBP, on-site NAP, reviews, and behavioral signals into one unified entity."
      sections={[
        {
          kind: "cards",
          title: "Local ranking factors",
          items: [
            { title: "Proximity", description: "Distance from searcher — non-negotiable; you can't fake it." },
            { title: "Relevance", description: "How well your GBP categories match the query." },
            { title: "Prominence", description: "Brand authority, reviews, citations across the web." },
            { title: "Behavioral", description: "Click-through, calls, directions from real searchers." },
          ],
        },
        {
          kind: "table",
          title: "GBP optimization checklist",
          columns: ["Area", "Action"],
          rows: [
            ["Categories", "Choose primary + 4 secondary that match intent"],
            ["Description", "750-char keyword-rich business summary"],
            ["Photos", "Upload weekly — logo, cover, products, team"],
            ["Posts", "Weekly offers, events, updates"],
            ["Q&A", "Seed 5 questions with your own answers"],
            ["Reviews", "Reply to 100% within 24h, target 4.5+ star avg"],
            ["Attributes", "Accessibility, payment, service options"],
            ["Hours", "Special hours for holidays, in-store vs curbside"],
          ],
        },
      ]}
      bestPractices={[
        "Maintain NAP consistency across every directory — drift destroys ranking.",
        "Generate review velocity, not just review count — 5/week beats 50 in one burst.",
        "Use geo-tagged photos (with EXIF preserved) — they feed prominence.",
        "Create location-specific pages with unique content for multi-branch businesses.",
      ]}
      examples={[
        { query: "\"best coffee near me\"", result: "Map pack with 3 top-rated cafés, walking time, and reviews." },
      ]}
    />
  );
}