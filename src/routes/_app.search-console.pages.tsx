import { createFileRoute } from "@tanstack/react-router";
import { ConsolePage, ConsoleFilters, ConsoleTable } from "@/components/search-console-page";

export const Route = createFileRoute("/_app/search-console/pages")({
  head: () => ({ meta: [{ title: "Pages — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Pages" description="Top-performing URLs by clicks, impressions, CTR, and average position.">
      <ConsoleFilters />
      <ConsoleTable
        columns={["Page", "Clicks", "Impressions", "CTR", "Position"]}
        rows={[
          { cells: ["/ai-marketing-automation", "1,204", "32,800", "3.7%", "4.2"] },
          { cells: ["/enterprise-seo-platform", "912", "18,200", "5.0%", "3.1"] },
          { cells: ["/pricing", "754", "24,100", "3.1%", "6.8"] },
          { cells: ["/blog/cwv-guide", "612", "12,400", "4.9%", "5.4"] },
          { cells: ["/about", "284", "8,200", "3.4%", "12.1"] },
          { cells: ["/contact", "184", "4,200", "4.4%", "8.2"] },
        ]}
      />
    </ConsolePage>
  );
}