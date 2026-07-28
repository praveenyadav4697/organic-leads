import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/future-trends")({
  head: () => ({ meta: [{ title: "Future Trends — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Future Trends"
      description="Multimodal, agents, and the zero-click endgame — preparing your SEO for 2026 and beyond."
      summary="Search is shifting from text to multimodal, from results to conversations, and from clicks to agents. The fundamentals still matter — quality content, technical excellence, entity authority — but the surfaces they live on are evolving fast."
      sections={[
        {
          kind: "cards",
          title: "Trends to plan for",
          items: [
            { title: "Multimodal search", description: "Camera-first queries via Lens + Live search — image + video ranking equal to text." },
            { title: "Agent-driven SEO", description: "Agents acting on behalf of users — APIs + structured data become ranking surfaces." },
            { title: "Zero-click SERPs", description: "70%+ of queries resolved without a click — visibility beats traffic." },
            { title: "Personal knowledge graphs", description: "Search results personalized to your private knowledge graph." },
            { title: "Voice-first commerce", description: "Conversational checkout via assistants — feed accuracy is everything." },
          ],
        },
        {
          kind: "table",
          title: "Preparation checklist",
          columns: ["Trend", "Action"],
          rows: [
            ["Multimodal", "Optimize imagery + video with rich metadata"],
            ["Agents", "Expose structured APIs + product feeds"],
            ["Zero-click", "Build brand SERPs + entity authority"],
            ["Personal graphs", "Earn + claim entity connections"],
            ["Voice commerce", "Implement signed-exchange + cart schema"],
          ],
        },
      ]}
      bestPractices={[
        "Invest in entity authority — it survives every surface change.",
        "Publish machine-readable data (feeds, APIs, structured data) for agents.",
        "Track visibility, not just clicks — share of SERP matters more than CTR.",
        "Build a brand SERP you own — knowledge panel, sitelinks, PAA presence.",
      ]}
      examples={[
        { query: "\"plan a 3-day trip to tokyo\"", result: "Agent-style response synthesizing flights, hotels, itinerary, and bookings — all from cited sources." },
      ]}
    />
  );
}