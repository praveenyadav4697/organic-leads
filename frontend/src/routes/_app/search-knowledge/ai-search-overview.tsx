import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/ai-search-overview")({
  head: () => ({ meta: [{ title: "AI Search Overview | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="AI Search Overview"
      description="SGE, Gemini answers, AI Mode, and the new rules of citation-driven visibility."
      summary="Google's AI Overview is the most disruptive SERP change in a decade. It synthesizes answers from multiple sources, attributes citations, and dramatically changes what 'ranking #1' means. Visibility now means being cited inside the answer block."
      sections={[
        {
          kind: "cards",
          title: "AI surfaces",
          items: [
            { title: "AI Overview", description: "Top-of-page synthesized answer with inline citations." },
            { title: "AI Mode", description: "Conversational follow-up mode powered by Gemini." },
            { title: "Deep Search", description: "Multi-step research mode for complex questions." },
            { title: "Search Live", description: "Real-time multimodal search via phone camera and mic." },
          ],
        },
        {
          kind: "table",
          title: "How to win citations",
          columns: ["Signal", "Why it matters", "Tactic"],
          rows: [
            ["Entity authority", "Gemini cites trusted sources first", "SameAs schema + Wikidata"],
            ["Concise definitions", "First sentence gets extracted", "40–55 word definition blocks"],
            ["Statistics + data", "Quoted figures become citations", "Add original research"],
            ["Author E-E-A-T", "Named authors boost trust", "Person schema + byline"],
            ["Freshness", "Live answers beat stale content", "Update timestamps visible"],
          ],
        },
        {
          kind: "code",
          title: "Definition block template (citation magnet)",
          language: "markdown",
          code: `## What is AI Search Overview?

AI Search Overview is a Google feature that uses Gemini
to synthesize a direct answer from multiple sources and
display it at the top of the SERP with inline citations
to the most authoritative URLs.

(Source: Google Search Central, 2026)`,
        },
      ]}
      bestPractices={[
        "Lead every pillar with a 50-word definition block — Gemini extracts this first.",
        "Publish original research — statistics are cited far more than opinion.",
        "Implement Speakable schema for voice and AI-friendly markup.",
        "Monitor AI Overview citation share | Organic Leads Copilot tracks this automatically.",
      ]}
      examples={[
        { query: "\"what is cwv\"", result: "AI Overview cites 3 sources with definitions — your 50-word block can win citation 1." },
      ]}
    />
  );
}