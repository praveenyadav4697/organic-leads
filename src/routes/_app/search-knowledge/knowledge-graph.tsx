import { createFileRoute } from "@tanstack/react-router";
import { Brain } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/knowledge-graph")({
  head: () => ({ meta: [{ title: "Knowledge Graph — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Knowledge Graph"
      description="Entities, panels, and how Google connects every fact about your brand."
      summary="The Knowledge Graph is Google's structured entity store — 500B+ facts about 50B entities. It powers the Knowledge Panel you see for brands, people, places and things. Become an authoritative entity and Google will literally own your brand SERP."
      sections={[
        {
          kind: "cards",
          title: "Core entity types",
          items: [
            { title: "Organization", description: "Brand panel — logo, social, founders, stock, subsidiaries." },
            { title: "Person", description: "Author panel — bio, works, social profiles, education." },
            { title: "Place", description: "Local business panel — address, hours, photos, reviews." },
            { title: "CreativeWork", description: "Book / album / movie / software panel." },
            { title: "Event", description: "Concerts, conferences, product launches — timeline." },
          ],
        },
        {
          kind: "table",
          title: "How Google builds entity authority",
          columns: ["Signal", "Source", "Weight"],
          rows: [
            ["Wikidata / Wikipedia", "Editorial", "Very high"],
            ["Official schema + sameAs", "Your site", "High"],
            ["Authoritative mentions", "News / .edu / .gov", "High"],
            ["Cross-entity links", "Internal markup", "Medium"],
            ["Reviews + ratings", "Trusted platforms", "Medium"],
          ],
        },
        {
          kind: "code",
          title: "JSON-LD · Organization with sameAs",
          language: "json-ld",
          code: `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Acme Corporation",
  "url": "https://acme.io",
  "logo": "https://acme.io/logo.png",
  "sameAs": [
    "https://www.wikidata.org/wiki/Q123",
    "https://www.linkedin.com/company/acme",
    "https://twitter.com/acme",
    "https://github.com/acme"
  ],
  "founder": { "@type": "Person", "name": "Ava Kepler" }
}`,
        },
      ]}
      bestPractices={[
        "Get a Wikidata entry — it is the primary canonical source for entity resolution.",
        "Use sameAs links on Organization and Person schemas to bind all your profiles.",
        "Earn coverage from .edu, .gov, and major news outlets — entity weight comes from authority.",
        "Maintain consistent NAP (Name, Address, Phone) across the web for local entity resolution.",
        "Build author entities with Person schema on every byline.",
      ]}
      examples={[
        { query: "apple inc", result: "Knowledge panel with logo, founders, stock, products, subsidiaries — entity-driven." },
        { query: "neil patel", result: "Person panel with bio, social profiles, works, education." },
      ]}
    />
  );
}