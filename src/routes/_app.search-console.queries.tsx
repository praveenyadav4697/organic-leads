import { createFileRoute } from "@tanstack/react-router";
import { ConsolePage, ConsoleFilters, ConsoleTable } from "@/components/search-console-page";

export const Route = createFileRoute("/_app/search-console/queries")({
  head: () => ({ meta: [{ title: "Search Queries — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Search Queries" description="Every user query that returned your pages in Google search results.">
      <ConsoleFilters />
      <ConsoleTable
        columns={["Query", "Clicks", "Impressions", "CTR", "Position"]}
        rows={[
          { cells: ["ai marketing automation", "1,204", "32,800", "3.7%", "4.2"] },
          { cells: ["enterprise seo platform", "912", "18,200", "5.0%", "3.1"] },
          { cells: ["best crm software", "754", "24,100", "3.1%", "6.8"] },
          { cells: ["digital marketing dashboard", "612", "12,400", "4.9%", "5.4"] },
          { cells: ["seo audit tool", "484", "31,800", "1.5%", "8.1"] },
          { cells: ["core web vitals optimizer", "402", "5,400", "7.4%", "2.1"] },
        ]}
      />
    </ConsolePage>
  );
}