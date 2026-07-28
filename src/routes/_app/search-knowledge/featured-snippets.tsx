import { createFileRoute } from "@tanstack/react-router";
import { PanelTop } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/featured-snippets")({
  head: () => ({ meta: [{ title: "Featured Snippets — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Featured Snippets"
      description="Position zero — and how to capture it with structure, brevity, and authority."
      summary="Featured snippets pull a 40–60 word answer (plus optional list or table) from an organic result and pin it above #1. They win 35–45% of clicks on the query. Capture them by answering the question directly under the right header, with structured markup."
      sections={[
        {
          kind: "cards",
          title: "Snippet types",
          items: [
            { title: "Paragraph", description: "Direct definition or short answer to a 'what is' query." },
            { title: "List", description: "Numbered or bulleted steps pulled from a heading section." },
            { title: "Table", description: "Comparison data rendered from an HTML <table>." },
            { title: "Video", description: "YouTube clip pulled from the page, with timestamped chapters." },
          ],
        },
        {
          kind: "table",
          title: "Trigger patterns",
          columns: ["Query type", "Snippet type", "Content pattern"],
          rows: [
            ["what is X", "Paragraph", "40–55 word definition under H2"],
            ["how to X", "List (numbered)", "H2 + ordered list 5–8 steps"],
            ["X vs Y", "Table", "H2 + <table> with attributes side-by-side"],
            ["best X for Y", "List (bulleted)", "H2 + bullets with short justifications"],
            ["X + year", "Paragraph", "Fresh date in definition with current data"],
          ],
        },
        {
          kind: "list",
          title: "Optimization playbook",
          items: [
            "Match the exact phrasing of the query in your H2.",
            "Place the answer immediately under the H2 — within 100 words.",
            "Use semantic HTML (ul, ol, table) so the snippet engine can extract cleanly.",
            "Include FAQ schema for question-style queries — Google's extractor prefers marked-up Q&A.",
            "Track snippet ownership daily — Google rotates snippets often.",
          ],
        },
      ]}
      bestPractices={[
        "Target snippets on queries where you're already in the top 10 — page-2 content rarely wins.",
        "Don't double-source answers — give Google one clear block to extract.",
        "Use tables for any comparative query — Google loves tabular data for snippets.",
        "Refresh snippet-eligible content every 6 months to retain ownership.",
      ]}
      examples={[
        { query: "\"what is core web vitals\"", result: "Paragraph snippet pulled from a 50-word definition block." },
        { query: "\"how to improve lcp\"", result: "Numbered list snippet — 6 steps with bold first words." },
      ]}
    />
  );
}