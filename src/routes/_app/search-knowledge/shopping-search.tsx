import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/shopping-search")({
  head: () => ({ meta: [{ title: "Shopping Search — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Shopping Search"
      description="Free listings, Shopping ads, and the Merchant Center playbook for retail SERP dominance."
      summary="Shopping now owns more SERP real estate than any other vertical. Free product listings are the largest organic opportunity Google has shipped in a decade — they require a connected Merchant Center and high-quality product data."
      sections={[
        {
          kind: "cards",
          title: "Shopping surfaces",
          items: [
            { title: "Free product listings", description: "Organic product carousel triggered by merchant feed + matching page." },
            { title: "Shopping ads", description: "Paid placements at top and side of shopping-heavy SERPs." },
            { title: "Image badges", description: "Price and availability overlay on product images." },
            { title: "Comparison UI", description: "Filterable shopping grid on mobile SERP." },
          ],
        },
        {
          kind: "table",
          title: "Merchant Center feed essentials",
          columns: ["Field", "Required"],
          rows: [
            ["id", "Yes"],
            ["title", "Yes — 150 chars max, no promotional text"],
            ["description", "Yes — 5,000 chars max"],
            ["link", "Yes — must match landing page"],
            ["image_link", "Yes — high-res, white-bg preferred"],
            ["price", "Yes — matches page + currency"],
            ["availability", "Yes — in_stock / out_of_stock / preorder"],
            ["gtin", "Recommended — drives eligibility"],
            ["brand", "Required for adult apparel"],
          ],
        },
      ]}
      bestPractices={[
        "Match feed data to landing-page content exactly — Google cross-checks.",
        "Submit all variants (size, color) as separate products with distinct IDs.",
        "Use high-quality, on-model product photography — at least 1,000×1,000.",
        "Keep price and availability in sync within 24 hours.",
        "Surface schema.org Product markup on every product page.",
      ]}
      examples={[
        { query: "\"nike pegasus 40\"", result: "Shopping carousel with 6+ retailers, prices, and free listings." },
      ]}
    />
  );
}