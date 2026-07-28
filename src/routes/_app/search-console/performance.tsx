import { createFileRoute } from "@tanstack/react-router";
import { ConsolePage, ConsoleFilters, ConsoleTable } from "@/components/search-console-page";
import { KpiCard } from "@/components/kpi-card";

export const Route = createFileRoute("/_app/search-console/performance")({
  head: () => ({ meta: [{ title: "Performance — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Performance" description="Full Search Console performance report — clicks, impressions, CTR, position by query, page, country, device.">
      <ConsoleFilters />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Clicks" value={24830} delta={5.4} />
        <KpiCard label="Impressions" value={482600} delta={3.2} />
        <KpiCard label="CTR" value={5.1} unit="%" delta={0.6} />
        <KpiCard label="Avg. position" value={12.8} delta={-1.4} ring={false} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-3">Top pages</div>
          <ConsoleTable
            columns={["Page", "Clicks", "Impr.", "CTR", "Pos."]}
            rows={[
              { cells: ["/ai-marketing-automation", "1,204", "32,800", "3.7%", "4.2"] },
              { cells: ["/enterprise-seo-platform", "912", "18,200", "5.0%", "3.1"] },
              { cells: ["/pricing", "754", "24,100", "3.1%", "6.8"] },
              { cells: ["/blog/cwv-guide", "612", "12,400", "4.9%", "5.4"] },
            ]}
          />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-3">Top queries</div>
          <ConsoleTable
            columns={["Query", "Clicks", "Impr.", "CTR", "Pos."]}
            rows={[
              { cells: ["ai marketing automation", "1,204", "32,800", "3.7%", "4.2"] },
              { cells: ["enterprise seo platform", "912", "18,200", "5.0%", "3.1"] },
              { cells: ["best crm software", "754", "24,100", "3.1%", "6.8"] },
              { cells: ["seo audit tool", "484", "31,800", "1.5%", "8.1"] },
            ]}
          />
        </div>
      </div>
    </ConsolePage>
  );
}