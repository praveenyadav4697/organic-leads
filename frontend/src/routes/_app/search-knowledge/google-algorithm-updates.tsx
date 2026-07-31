import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/google-algorithm-updates")({
  head: () => ({ meta: [{ title: "Google Algorithm Updates | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Google Algorithm Updates"
      description="Two decades of ranking changes — from PageRank to Helpful Content to Gemini."
      summary="Google ships 4,000+ algorithm changes a year, but only a few dozen materially move rankings. The timeline below captures the ones that reshaped how marketers build and structure content. Each entry includes what changed and how to win in the post-update world."
      sections={[
        {
          kind: "timeline",
          title: "Major updates that mattered",
          items: [
            { year: "2003", title: "Florida", description: "First major commercial-intent update — penalized link spam and keyword stuffing." },
            { year: "2011", title: "Panda", description: "Downranked thin / duplicate content. Started the content-quality era." },
            { year: "2012", title: "Penguin", description: "Penalized unnatural link profiles. Made link buying risky at scale." },
            { year: "2013", title: "Hummingbird", description: "Semantic search — query understanding over keyword matching." },
            { year: "2015", title: "Mobilegeddon / RankBrain", description: "Mobile-friendly boost + ML-based ranking for ambiguous queries." },
            { year: "2018", title: "Medic (E-A-T)", description: "YMYL categories rewarded expertise, authority, and trustworthiness." },
            { year: "2020", title: "Core Updates + Page Experience", description: "Page signals formalized as ranking criteria (CWV)." },
            { year: "2022", title: "Helpful Content Update", description: "Sitewide penalty for content made primarily for search engines." },
            { year: "2024", title: "E-E-A-T + AI Content", description: "Added Experience signal, refined stance on AI-assisted content." },
            { year: "2025", title: "Gemini Integration", description: "Deep Gemini integration across ranking, AI Overview, and Search Generative Experience." },
          ],
        },
        {
          kind: "table",
          title: "How to recover after a core update",
          columns: ["Step", "Action", "Timeline"],
          rows: [
            ["1", "Audit thin pages and consolidate", "Week 1"],
            ["2", "Improve E-E-A-T — author bios, citations", "Weeks 2–4"],
            ["3", "Refresh outdated content with new data", "Weeks 4–8"],
            ["4", "Disavow toxic backlinks if needed", "Weeks 6–10"],
            ["5", "Submit reconsideration / re-index signal", "Week 12"],
          ],
        },
        {
          kind: "list",
          title: "What hasn't changed",
          items: [
            "High-quality, original content always wins long-term.",
            "Strong brand + entity authority compounds every update.",
            "Technical excellence (speed, mobile, security) is a hard floor, not a bonus.",
            "User satisfaction signals are the most durable ranking factor.",
          ],
        },
      ]}
      bestPractices={[
        "Subscribe to Organic Leads's update alerts to react within 48h of a confirmed rollout.",
        "Build content for humans first — Helpful Content penalties are sitewide.",
        "Track ranking volatility daily during core update windows.",
        "Document changes you make pre/post update so you can attribute wins and losses.",
      ]}
      examples={[
        { query: "\"google update\" filter:newer_than:1d", result: "Surface the latest confirmed update chatter from SEOs on X and forums." },
      ]}
    />
  );
}