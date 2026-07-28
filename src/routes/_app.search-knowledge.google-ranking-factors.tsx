import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";
import { BarChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";

export const Route = createFileRoute("/_app/search-knowledge/google-ranking-factors")({
  head: () => ({ meta: [{ title: "Google Ranking Factors — Nebula" }] }),
  component: Page,
});

const weight = [
  { factor: "Content relevance", value: 92 },
  { factor: "Backlinks", value: 84 },
  { factor: "UX / CWV", value: 78 },
  { factor: "Entity authority", value: 74 },
  { factor: "Brand signals", value: 70 },
  { factor: "Structured data", value: 58 },
  { factor: "On-page SEO", value: 54 },
  { factor: "Social signals", value: 28 },
];

function Page() {
  return (
    <KnowledgePage
      title="Google Ranking Factors"
      description="The signals Google weighs — by impact, by category, and by how to influence them."
      summary="Modern ranking blends content understanding, link authority, brand-level entity trust, and live UX signals. The relative weights below are derived from Nebula's correlation analyses across 4M keywords. Treat them as directional, not absolute."
      sections={[
        {
          kind: "chart",
          title: "Relative weight by factor category",
          description: "Higher score = stronger correlation with top-3 organic ranking.",
          chart: (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weight} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="factor" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={140} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ),
        },
        {
          kind: "cards",
          title: "Top-impact factors you can move",
          items: [
            { title: "Topical depth", description: "Comprehensive coverage of an entity — measured by internal links, schema, and content co-occurrence." },
            { title: "Backlink quality", description: "Authority and topical relevance of referring domains — far more than raw volume." },
            { title: "Engaged clicks", description: "Click-through + dwell-time from real users — feeds behavioral signals." },
            { title: "Page experience", description: "Core Web Vitals, mobile usability, HTTPS, no intrusive interstitials." },
            { title: "Structured data", description: "Valid Schema.org that lets Google render rich results and build entity understanding." },
          ],
        },
        {
          kind: "table",
          title: "Factor cheat-sheet by category",
          columns: ["Category", "Key signals", "Tactics"],
          rows: [
            ["Content", "Relevance, depth, freshness", "Pillar pages, FAQ blocks, freshness updates"],
            ["Links", "Authority, relevance, anchor", "Digital PR, internal links, broken-link recovery"],
            ["UX", "CWV, mobile, accessibility", "Image AVIF, lazy loading, font subsets"],
            ["Brand", "Mentions, sentiment, entity", "PR coverage, brand SERP optimization"],
            ["Schema", "JSON-LD, types, validity", "Implement Product, FAQ, Organization, Breadcrumb"],
          ],
        },
      ]}
      bestPractices={[
        "Audit each page's topical depth with Nebula Copilot before chasing backlinks.",
        "Treat UX as a ranking factor, not a nice-to-have — CWV is now a hard threshold.",
        "Earn brand mentions in editorial sources to feed entity authority signals.",
        "Keep your structured data valid — Google ignores invalid markup silently.",
      ]}
      examples={[
        { query: "nike.com SERP", result: "Ranks #1 for 'running shoes' — entity authority, backlinks, CWV all green." },
        { query: "best CRM software", result: "Comparison content with author E-E-A-T wins because of topical depth and brand trust." },
      ]}
    />
  );
}