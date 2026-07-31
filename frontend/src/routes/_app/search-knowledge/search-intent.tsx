import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/_app/search-knowledge/search-intent")({
  head: () => ({ meta: [{ title: "Search Intent | Organic Leads" }] }),
  component: Page,
});

const dist = [
  { name: "Informational", value: 58, color: "var(--color-primary)" },
  { name: "Commercial", value: 22, color: "var(--color-accent)" },
  { name: "Transactional", value: 12, color: "var(--color-chart-2)" },
  { name: "Navigational", value: 8, color: "var(--color-chart-3)" },
];

function Page() {
  return (
    <KnowledgePage
      title="Search Intent"
      description="Decode what the user actually wants — and align your content to win every SERP."
      summary="Intent — not keyword volume — predicts ranking difficulty and conversion potential. Google's neural rankers map queries to intent clusters and serve results accordingly. Win by matching format, depth, and freshness to the dominant intent of your target query."
      sections={[
        {
          kind: "chart",
          title: "Query distribution by intent",
          description: "Organic Leads classification across millions of monthly searches.",
          chart: (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dist} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {dist.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ),
        },
        {
          kind: "cards",
          title: "The four intent types",
          items: [
            { title: "Informational", description: "User wants to learn. Format: long-form guides, tutorials, videos, AI Overview.", meta: "Highest volume" },
            { title: "Commercial", description: "User is comparing. Format: listicles, comparison tables, reviews.", meta: "Highest CPC" },
            { title: "Transactional", description: "User is buying. Format: product pages, pricing, checkout.", meta: "Highest CVR" },
            { title: "Navigational", description: "User wants a specific site. Format: brand SERP, sitelinks.", meta: "Highest CTR" },
          ],
        },
        {
          kind: "table",
          title: "Format alignment cheat-sheet",
          columns: ["Intent", "Best format", "Schema", "CTA"],
          rows: [
            ["Informational", "Long-form guide + FAQ", "Article, FAQPage", "Newsletter, related reads"],
            ["Commercial", "Comparison list", "Product, Review", "Demo, free trial"],
            ["Transactional", "Pricing page", "Product + Offer", "Buy, sign up"],
            ["Navigational", "Brand SERP", "Organization + Sitelinks", "Login, support"],
          ],
        },
      ]}
      bestPractices={[
        "Always classify target keywords by intent before drafting.",
        "Match content depth to SERP — if the top-3 are 2,500+ words, 800 won't rank.",
        "Use mixed intent clusters to build pillar → cluster topologies.",
        "Track intent drift — Google's AI Overview is shifting many commercial queries toward informational.",
      ]}
      examples={[
        { query: "what is core web vitals", result: "Informational — Google serves a definition, PAA, and AI Overview." },
        { query: "ahrefs vs semrush", result: "Commercial investigation — comparison pages win, with pricing and feature tables." },
      ]}
    />
  );
}