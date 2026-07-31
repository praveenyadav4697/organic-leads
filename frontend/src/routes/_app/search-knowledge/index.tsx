import { createFileRoute } from "@tanstack/react-router";
import { SearchKnowledgePage } from "@/pages/SearchKnowledge";

export const Route = createFileRoute("/_app/search-knowledge/")({
  head: () => ({
    meta: [
      { title: "Search Knowledge â€” Nebula" },
      {
        name: "description",
        content:
          "AI-powered Search Knowledge Center for tracking search engine visibility, entities, topics, keywords, and more.",
      },
    ],
  }),
  component: SearchKnowledgePage,
});