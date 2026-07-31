import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/rich-results")({
  head: () => ({ meta: [{ title: "Rich Results | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Rich Results"
      description="Every schema-driven SERP feature Google can render — and how to win each one."
      summary="Rich results are the visual upgrades to the standard ten-blue-links. They are powered by Schema.org markup that Google's indexers can validate and trust. The list below covers every block your business can plausibly win, with implementation guidance."
      sections={[
        {
          kind: "cards",
          title: "Rich result types",
          items: [
            { title: "Article", description: "Top stories carousel · meta tags + Article schema." },
            { title: "Product", description: "Price, availability, reviews inline with image carousel." },
            { title: "Recipe", description: "Cooking time, calories, ratings, ingredients." },
            { title: "Event", description: "Date, location, ticket link in SERP card." },
            { title: "LocalBusiness", description: "Map pack + hours + reviews for branded searches." },
            { title: "FAQ", description: "Expandable Q&A under organic result." },
            { title: "HowTo", description: "Step-by-step visual guide directly in SERP." },
            { title: "Job Posting", description: "Salary, location, apply link — via structured hiring data." },
            { title: "Video", description: "Timestamped video carousel with key moments." },
            { title: "Breadcrumb", description: "Trail of category pages shown under title." },
            { title: "Organization", description: "Logo, social profiles, corporate info in knowledge panel." },
            { title: "Speakable", description: "Voice-ready markup for news publishers." },
          ],
        },
        {
          kind: "table",
          title: "Required fields (top features)",
          columns: ["Type", "Required JSON-LD", "Notes"],
          rows: [
            ["Product", "name, image, price, availability, sku", "Use Offer nested object"],
            ["FAQ", "Question, acceptedAnswer", "Max 10 per page"],
            ["HowTo", "step[], name, text", "Step must be ordered"],
            ["Article", "headline, image, datePublished", "Add author for E-E-A-T"],
            ["LocalBusiness", "name, address, telephone, geo", "Match GBP exactly"],
          ],
        },
        {
          kind: "code",
          title: "JSON-LD template · Product",
          language: "json-ld",
          code: `{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Organic Leads Plan",
  "image": "https://Organic Leads.io/og.png",
  "description": "AI marketing OS for enterprise teams",
  "sku": "NEB-PRO-001",
  "brand": { "@type": "Brand", "name": "Organic Leads" },
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "499.00",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "312"
  }
}`,
        },
      ]}
      bestPractices={[
        "Validate every page with Google's Rich Results Test before shipping.",
        "Match on-page content exactly to the markup — Google ignores mismatched data.",
        "Avoid spam patterns (fake reviews, hidden prices) — SpamBrain flags them aggressively.",
        "Use one dominant schema type per page — multiple competing types dilute eligibility.",
      ]}
      examples={[
        { query: "\"iphone 15\" SERP", result: "Product carousel + reviews + shopping carousel · powered by Merchant Center + schema." },
      ]}
    />
  );
}