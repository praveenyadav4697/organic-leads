import { createFileRoute } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/people-also-ask")({
  head: () => ({ meta: [{ title: "People Also Ask — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="People Also Ask"
      description="Mine the question graph to dominate topics and earn cluster CTR."
      summary="People Also Ask (PAA) is the SERP's question graph. Each PAA box, when expanded, surfaces 4 new questions — an exponential tree that reveals the actual questions your audience has. Capture PAA to win multiple positions on the same SERP."
      sections={[
        {
          kind: "cards",
          title: "PAA mechanics",
          items: [
            { title: "Source", description: "Generated from indexed content with strong question intent signals." },
            { title: "Trigger", description: "Algorithmic — based on query, location, device, history." },
            { title: "Click behavior", description: "Click rate influences which PAA shows next in the chain." },
            { title: "Refresh", description: "Continuously regenerated from top-ranking pages for each query." },
          ],
        },
        {
          kind: "table",
          title: "How to dominate PAA for a topic",
          columns: ["Step", "Action"],
          rows: [
            ["1", "Seed with 20 root questions from your target topic."],
            ["2", "Expand each question to 4 sub-questions (use AI)." ],
            ["3", "Write 1 H2 per question with a 50-word answer + FAQ schema."],
            ["4", "Interlink every question page to the pillar."],
            ["5", "Track PAA wins weekly and refresh weak answers."],
          ],
        },
        {
          kind: "list",
          title: "PAA win patterns",
          items: [
            "Answer the question under a heading phrased exactly like the PAA.",
            "Keep answers 40–60 words — long enough to be useful, short enough to fit.",
            "Add FAQPage JSON-LD to every Q&A block to boost eligibility.",
            "Cover adjacent questions in the same article to expand capture.",
          ],
        },
      ]}
      bestPractices={[
        "Use PAA mining tools (Nebula, AlsoAsked, AnswerThePublic) to expand topic clusters.",
        "One FAQ per H2 — never bury multiple questions under one header.",
        "Refresh PAA-targeted content every 90 days; freshness matters more here than elsewhere.",
        "Track which PAA boxes your pages own via Search Console > Performance > queries.",
      ]}
      examples={[
        { query: "\"ai marketing automation\"", result: "PAA shows 8 questions including 'what is it', 'how does it work', 'best tools'." },
      ]}
    />
  );
}