import { createFileRoute } from "@tanstack/react-router";
import { Search, Database, Cog, Globe } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";
import { LineChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Line, Tooltip } from "recharts";

export const Route = createFileRoute("/_app/search-knowledge/google-search-architecture")({
  head: () => ({ meta: [{ title: "Google Search Architecture — Nebula" }] }),
  component: Page,
});

const pipeline = [
  { d: "v1", crawled: 1, indexed: 1 },
  { d: "v2", crawled: 4, indexed: 3 },
  { d: "v3", crawled: 12, indexed: 9 },
  { d: "v4", crawled: 28, indexed: 22 },
  { d: "v5", crawled: 48, indexed: 39 },
  { d: "v6", crawled: 65, indexed: 54 },
  { d: "v7", crawled: 84, indexed: 71 },
];

function Page() {
  return (
    <KnowledgePage
      title="Google Search Architecture"
      description="The four-stage pipeline that turns the web into answers: crawling, indexing, ranking, serving."
      summary="Google's modern stack is a distributed system of crawlers, the Caffeine index, multiple ranking models (including deep neural nets), and the live serving layer that runs in under 600ms. Understanding this pipeline helps you diagnose exactly where your SEO wins and losses happen."
      sections={[
        {
          kind: "cards",
          title: "The four stages",
          items: [
            { title: "Crawling", description: "Distributed crawlers (per-cluster) discover and fetch pages, follow links, and respect directives.", icon: <Globe className="size-4 text-primary" />, meta: "Billions of URLs / day" },
            { title: "Indexing", description: "Parsed, normalized, deduplicated and stored in the Caffeine doc index with canonical signals.", icon: <Database className="size-4 text-primary" />, meta: "Hundreds of PB" },
            { title: "Ranking", description: "Hundreds of signals — content, links, entities, freshness, user signals — combined by neural rankers.", icon: <Cog className="size-4 text-primary" />, meta: "Deep neural · MUM" },
            { title: "Serving", description: "Live retrieval + AI overlay (SGE / Gemini) generates the SERP in < 600ms with personalization.", icon: <Search className="size-4 text-primary" />, meta: "Sub-second p95" },
          ],
        },
        {
          kind: "chart",
          title: "Pipeline volume (trillion URLs)",
          description: "Crawl vs Index growth over the last 7 generations of infrastructure.",
          chart: (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="crawled" stroke="var(--color-primary)" strokeWidth={2.4} dot={false} />
                <Line type="monotone" dataKey="indexed" stroke="var(--color-accent)" strokeWidth={2.4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ),
        },
        {
          kind: "list",
          title: "Sub-systems involved",
          items: [
            "Percolator — incremental indexing at petabyte scale",
            "TeraGoogle / Caffeine — column-store doc index",
            "SpamBrain — link, content, and behavior spam detection",
            "MUM / Gemini — multimodal understanding for ranking & AI answers",
            "Knowledge Graph Vault — entity store powering panels",
            "LiveSense — freshness signals and breaking-news pipelines",
            "Beacons & Crawl Budget Management — host-level priority scoring",
          ],
        },
      ]}
      bestPractices={[
        "Optimize crawl budget: keep internal linking tight and avoid low-value URL parameters.",
        "Ship clean canonical + hreflang signals so indexing does not fragment your pages.",
        "Render parity: ensure server-rendered HTML matches what users see — JavaScript-only content is re-indexed slower.",
        "Feed structured data so MUM and entity graphs understand your content deeply.",
        "Watch Core Web Vitals — they feed directly into the serving-layer UX signals.",
      ]}
      examples={[
        { query: "site:acme.io/blog", result: "Lists indexed blog URLs, helping you confirm indexing of new articles." },
        { query: "cache:acme.io", result: "Shows Google's last rendered snapshot — useful to verify content parity." },
        { query: "info:acme.io", result: "Returns indexed information, sitelinks and any known entity panel data." },
      ]}
    />
  );
}