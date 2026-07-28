import { createFileRoute } from "@tanstack/react-router";
import { ConsolePage, ConsoleFilters, ConsoleTable } from "@/components/search-console-page";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/coverage")({
  head: () => ({ meta: [{ title: "Coverage Report — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage
      title="Coverage Report"
      description="Every URL Google has tried to index — errors, valid pages, warnings, and exclusions."
    >
      <ConsoleFilters />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Valid", v: "1,284", s: "good" as const },
          { l: "Valid w/ warnings", v: "64", s: "warn" as const },
          { l: "Error", v: "18", s: "high" as const },
          { l: "Excluded", v: "162", s: "low" as const },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-semibold">{c.v}</div>
              <StatusBadge status={c.s} />
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <ConsoleTable
          columns={["URL", "Type", "Last crawl", "Reason"]}
          rows={[
            { cells: ["/blog/2024-ai-trends", "Excluded", "2d", "Duplicate without canonical"], status: "warn" },
            { cells: ["/product/old-sku-99", "Error", "1d", "404 Not Found"], status: "high" },
            { cells: ["/pricing", "Valid w/ warning", "8h", "Soft 404 detected"], status: "warn" },
            { cells: ["/about", "Valid", "12m", "Indexed, mobile-friendly"], status: "good" },
            { cells: ["/contact", "Valid", "20m", "Indexed, mobile-friendly"], status: "good" },
            { cells: ["/legacy/old-deals", "Excluded", "9d", "Blocked by robots.txt"], status: "low" },
          ]}
        />
      </div>
    </ConsolePage>
  );
}