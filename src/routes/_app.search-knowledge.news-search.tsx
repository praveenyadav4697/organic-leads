import { createFileRoute } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";
import { KnowledgePage } from "@/components/knowledge-page";

export const Route = createFileRoute("/_app/search-knowledge/news-search")({
  head: () => ({ meta: [{ title: "News Search — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <KnowledgePage
      title="News Search"
      description="Top Stories, Discover, and how publishers dominate news-driven SERPs."
      summary="News is a unique Google surface — it has its own crawler, its own index, and aggressive freshness signals. Publishers must meet structured-data requirements to be eligible for Top Stories and Discover."
      sections={[
        {
          kind: "cards",
          title: "News surfaces",
          items: [
            { title: "Top Stories carousel", description: "Pinned to top of news-related SERPs — requires NewsArticle schema." },
            { title: "News tab", description: "Dedicated news.google.com index for current events." },
            { title: "Discover feed", description: "Visual, personalized news feed in the Google mobile app." },
            { title: "Publisher center", description: "Google's portal for publishers to manage subscriptions + sections." },
          ],
        },
        {
          kind: "table",
          title: "NewsArticle required markup",
          columns: ["Field", "Required"],
          rows: [
            ["headline", "Yes"],
            ["datePublished", "Yes"],
            ["dateModified", "Recommended"],
            ["author", "Yes (Person with byline)"],
            ["image", "Yes (1200×675 minimum)"],
            ["publisher", "Yes (Organization + logo)"],
            ["articleSection", "Recommended"],
          ],
        },
      ]}
      bestPractices={[
        "Sign up for Google News Publisher Center to claim your publication.",
        "Stand up a separate News sitemap and submit via Search Console.",
        "Publish AMP or signed-exchange versions for Top Stories eligibility.",
        "Refresh evergreen news coverage every 6 months with updated statistics.",
        "Use a strict editorial review process — E-E-A-T is enforced hardest in news YMYL.",
      ]}
      examples={[
        { query: "\"ai policy update\"", result: "Top Stories carousel with 4 publishers, dates, and thumbnails." },
      ]}
    />
  );
}