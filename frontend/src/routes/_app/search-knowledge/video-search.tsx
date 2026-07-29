import { createFileRoute } from "@tanstack/react-router";
import { Video } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/video-search")({
  head: () => ({ meta: [{ title: "Video Search — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Video Search"
      description="YouTube, Shorts, and the web video carousel — how video dominates the modern SERP."
      summary="Video surfaces appear on more than 80% of commercial-intent SERPs. They pull from YouTube (primary), self-hosted pages with VideoObject schema, and short-form platforms. The biggest SEO lever in 2026 is producing video assets tied to your pillar topics."
      sections={[
        {
          kind: "cards",
          title: "Video surfaces in Google",
          items: [
            { title: "Video carousel", description: "Horizontal row of video thumbnails between organic blocks." },
            { title: "Featured video", description: "Single pinned video block above organic for how-to queries." },
            { title: "Shorts carousel", description: "Vertical short-form videos on mobile SERPs." },
            { title: "AI Overview citations", description: "Videos are increasingly cited inside Gemini answers." },
          ],
        },
        {
          kind: "table",
          title: "Video SEO essentials",
          columns: ["Element", "Requirement"],
          rows: [
            ["VideoObject schema", "Required for self-hosted video ranking"],
            ["Thumbnail", "Custom, 1280×720, branded, compelling"],
            ["Title", "Match search intent, lead with keyword"],
            ["Description", "First 2 lines carry snippet weight"],
            ["Captions / transcript", "Critical for indexing & accessibility"],
            ["Chapters / timestamps", "Required for 'key moments' in SERP"],
            ["Embed placement", "Above-the-fold on the page"],
          ],
        },
      ]}
      bestPractices={[
        "Publish on YouTube first — it has the strongest domain authority for video SERPs.",
        "Embed videos on the corresponding pillar page to consolidate ranking signals.",
        "Generate transcript markup — Google's NLP indexer relies on text for video understanding.",
        "Use chapters for any video longer than 60 seconds — unlocks 'key moments'.",
        "Repurpose long videos into Shorts to win both carousel surfaces.",
      ]}
      examples={[
        { query: "\"how to improve cwv\"", result: "Featured video + carousel with key moments on timestamps." },
      ]}
    />
  );
}