import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/image-search")({
  head: () => ({ meta: [{ title: "Image Search | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="Image Search"
      description="Visual SERP, Google Lens, and image SEO — a complete playbook for the 22% of Google traffic that comes from images."
      summary="Image search is no longer a passive byproduct of SEO. With Google Lens and AI Overview, images are first-class ranking surfaces. Win by shipping high-quality, properly-tagged, fast-loading originals with semantic context."
      sections={[
        {
          kind: "cards",
          title: "Image surfaces",
          items: [
            { title: "Web image results", description: "Standard image pack under organic, often above-the-fold." },
            { title: "Google Lens", description: "Visual search by image — recognizes objects, text, places." },
            { title: "AI Overview visuals", description: "Inline images generated or cited by Gemini answers." },
            { title: "Discover", description: "Visual-first feed in the Google mobile app." },
            { title: "Image licenses", description: "Creative Commons filtering in image SERP." },
          ],
        },
        {
          kind: "table",
          title: "Image SEO checklist",
          columns: ["Element", "Best practice"],
          rows: [
            ["Filename", "descriptive-keywords.jpg (no underscores, no IDs)"],
            ["Alt text", "describes image + keyword where natural"],
            ["Format", "AVIF / WebP preferred, JPEG for photos"],
            ["Size", "under 100KB for thumbnails, 200KB for hero"],
            ["Lazy load", "loading=\"lazy\" except above-the-fold"],
            ["Sitemap", "Image sitemap with caption + title fields"],
            ["Schema", "ImageObject JSON-LD with contentUrl"],
            ["CDN", "responsive srcset with width descriptors"],
          ],
        },
      ]}
      bestPractices={[
        "Use original photography where possible — stock images rank worse in 2026.",
        "Add structured alt text that describes both subject and context.",
        "Always serve AVIF or WebP — Google's Core Web Vitals now factor image bytes.",
        "Submit an image sitemap and validate it monthly.",
        "Optimize for Lens: clear subject, branded watermark, recognizable composition.",
      ]}
      examples={[
        { query: "image:avocado toast", result: "Web image pack + Discover-style vertical cards." },
        { query: "Google Lens · bookshelf photo", result: "Identifies titles, recommends purchases, surfaces related products." },
      ]}
    />
  );
}