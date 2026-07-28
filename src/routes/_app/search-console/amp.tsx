import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { ConsolePage, ConsoleTable } from "@/components/search-console-page";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/amp")({
  head: () => ({ meta: [{ title: "AMP — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="AMP" description="Accelerated Mobile Pages status, errors, and indexed count.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { l: "Indexed AMP pages", v: "42" },
          { l: "Valid", v: "40" },
          { l: "Errors", v: "2" },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
            <div className="text-2xl font-semibold mt-2">{c.v}</div>
          </div>
        ))}
      </div>

      <ConsoleTable
        columns={["AMP URL", "Issues"]}
        rows={[
          { cells: ["/amp/blog/cwv-guide", "—"], status: "good" },
          { cells: ["/amp/blog/ai-trends", "Tag mismatch"], status: "warn" },
          { cells: ["/amp/blog/seo-guide", "Custom JS"], status: "warn" },
        ]}
      />

      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="size-4 text-primary" />
          <div className="text-sm font-semibold">AMP recommendation</div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Modern equivalent: migrate AMP URLs to signed-exchange (SXA) for Google Search Top Stories. AMP support in
          Search Console is being sunset over the next 12 months.
        </p>
      </div>
    </ConsolePage>
  );
}