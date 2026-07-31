import { createFileRoute } from "@tanstack/react-router";
import { ConsolePage } from "@/components/search-console-page";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/mobile-usability")({
  head: () => ({ meta: [{ title: "Mobile Usability | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Mobile Usability" description="Mobile-specific issues Google found while crawling your site.">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Mobile-friendly" value={96} unit="%" delta={1.2} />
        <KpiCard label="Touch targets OK" value={94} unit="%" delta={0.4} />
        <KpiCard label="Viewport OK" value={100} unit="%" delta={0} />
        <KpiCard label="Font size OK" value={92} unit="%" delta={-1.0} />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-3">Issues found</div>
        <div className="divide-y divide-border">
          {[
            { url: "/blog/old-2024-post", issue: "Text too small to read", s: "medium" as const },
            { url: "/pricing", issue: "Clickable elements too close together", s: "medium" as const },
            { url: "/blog/cwv-guide", issue: "Content wider than screen", s: "low" as const },
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