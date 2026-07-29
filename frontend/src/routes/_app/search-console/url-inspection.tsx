import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ConsolePage } from "@/components/search-console-page";

export const Route = createFileRoute("/_app/search-console/url-inspection")({
  head: () => ({ meta: [{ title: "URL Inspection — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage
      title="URL Inspection"
      description="Test any URL's indexability, render, and Google-selected canonical in real time."
    >
      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Inspect URL</div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input defaultValue="https://acme.io/ai-marketing-automation" className="pl-9 rounded-xl h-12" />
              </div>
              <Button className="h-12 rounded-xl gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">Inspect</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Indexing</div>
          <div className="text-2xl font-semibold mt-2 flex items-center gap-2">URL is on Google <StatusBadge status="good" /></div>
          <p className="text-xs text-muted-foreground mt-2">Last crawl 12h ago · Indexed variant matches canonical.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Rendering</div>
          <div className="text-2xl font-semibold mt-2 flex items-center gap-2">Mobile-friendly <StatusBadge status="good" /></div>
          <p className="text-xs text-muted-foreground mt-2">Render parity: 100%. No JS-only content hidden from Google.</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Canonical</div>
          <div className="text-2xl font-semibold mt-2 flex items-center gap-2">Self-referential <StatusBadge status="good" /></div>
          <p className="text-xs text-muted-foreground mt-2">User-declared canonical matches Google-selected canonical.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Inspection history (recent)</div>
        <div className="divide-y divide-border">
          {[
            { url: "/ai-marketing-automation", status: "good", when: "12m ago" },
            { url: "/enterprise-seo-platform", status: "good", when: "1h ago" },
            { url: "/pricing", status: "warn", when: "3h ago" },
            { url: "/blog/old-post-2024", status: "high", when: "Yesterday" },
          ].map((r) => (
            <div key={r.url} className="flex items-center gap-4 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.url}</div>
                <div className="text-xs text-muted-foreground">{r.when}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    </ConsolePage>
  );
}