import { createFileRoute } from "@tanstack/react-router";
import { Mic } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/voice-search")({
  head: () => ({ meta: [{ title: "Voice Search | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Voice Search"
      description="Conversational queries, featured snippets, and how to be the answer a voice assistant speaks."
      summary="Voice queries are longer, more conversational, and biased toward position-zero answers. Voice assistants answer one result, not ten. Win by being the concise, structured, semantically rich answer to conversational questions."
      sections={[
        {
          kind: "cards",
          title: "Voice surfaces",
          items: [
            { title: "Google Assistant", description: "Answers to questions via phone, smart speakers, Android Auto." },
            { title: "Gemini Live", description: "Conversational AI assistant on Android." },
            { title: "Siri + ChatGPT", description: "Hybrid assistant answers using web + model knowledge." },
            { title: "Alexa", description: "Shopping + Q&A on Echo devices." },
          ],
        },
        {
          kind: "table",
          title: "Voice query patterns",
          columns: ["Pattern", "Example", "Format"],
          rows: [
            ["Question", "\"hey google what is cwv\"", "40-word definition"],
            ["How-to", "\"ok google how to fix lcp\"", "Numbered steps"],
            ["Near me", "\"alexa find coffee near me\"", "Local pack"],
            ["Comparison", "\"siri which is better semrush or ahrefs\"", "Comparison table"],
          ],
        },
      ]}
      bestPractices={[
        "Use Speakable schema to mark sections intended for voice answers.",
        "Match the conversational phrasing of the query in your H2 / first sentence.",
        "Lead with direct answers — voice assistants rarely speak more than 60 words.",
        "Optimize for featured snippet position — voice answers pull from snippet blocks.",
      ]}
      examples={[
        { query: "\"hey google best crm for small business\"", result: "Spoken answer from a featured snippet citing a list of 5 options." },
      ]}
    />
  );
}