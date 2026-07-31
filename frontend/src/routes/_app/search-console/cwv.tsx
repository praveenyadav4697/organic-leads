import { createFileRoute } from "@tanstack/react-router";
import { ConsolePage } from "@/components/search-console-page";
import { KpiCard } from "@/components/kpi-card";
import { ProgressRing } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/cwv")({
  head: () => ({ meta: [{ title: "Core Web Vitals | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage
      title="Core Web Vitals"
      description="Search Console's Core Web Vitals report — origin-level scoring across mobile and desktop."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { l: "Mobile", good: 78, bad: 12 },
          { l: "Desktop", good: 96, bad: 2 },
          { l: "Custom group (top pages)", good: 84, bad: 6 },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <ProgressRing value={c.good} size={68} />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
              <div className="text-2xl font-semibold mt-1">{c.good}% good</div>
              <div className="text-xs text-muted-foreground">{c.bad}% need improvement</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="LCP (mobile)" value={2.1} unit="s" hint="Target ≤ 2.5s" />
        <KpiCard label="INP (mobile)" value={180} unit="ms" hint="Target ≤ 200ms" />
        <KpiCard label="CLS (mobile)" value={0.06} hint="Target ≤ 0.1" />
        <KpiCard label="LCP (desktop)" value={1.4} unit="s" hint="Target ≤ 2.5s" />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">URL groups needing improvement</div>
        <div className="divide-y divide-border">
          {[
            { url: "/pricing", issue: "LCP slow (3.4s)", s: "high" as const },
            { url: "/enterprise-seo-platform", issue: "CLS high (0.18)", s: "medium" as const },
            { url: "/blog/cwv-guide", issue: "INP slow (260ms)", s: "medium" as const },
            { url: "/contact", issue: "All green", s: "good" as const },
          ].map((r) => (
            <div key={r.url} className="flex items-center gap-4 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.url}</div>
                <div className="text-xs text-muted-foreground">{r.issue}</div>
              </div>
              <StatusBadge status={r.s} />
            </div>
          ))}
        </div>
      </div>
    </ConsolePage>
  );
}