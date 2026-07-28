import { createFileRoute } from "@tanstack/react-router";
import { FileCode, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsolePage, ConsoleTable } from "@/components/search-console-page";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/sitemaps")({
  head: () => ({ meta: [{ title: "Sitemaps — Nebula" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage
      title="Sitemaps"
      description="Submitted sitemaps, processing status, indexing coverage, and crawl errors."
      actions={<Button className="rounded-xl h-10">+ Add sitemap</Button>}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { l: "Submitted URLs", v: "1,284" },
          { l: "Indexed", v: "1,224" },
          { l: "Errors", v: "8" },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
            <div className="text-2xl font-semibold mt-2">{c.v}</div>
          </div>
        ))}
      </div>

      <ConsoleTable
        columns={["Sitemap", "Type", "URLs", "Status", "Last fetched"]}
        rows={[
          { cells: ["sitemap.xml", "Index", "1,284", <span className="flex items-center gap-1 text-success"><RefreshCw className="size-3" /> Success</span>, "3h ago"], status: "good" },
          { cells: ["sitemap-blog.xml", "Sitemap", "320", <span className="flex items-center gap-1 text-success"><RefreshCw className="size-3" /> Success</span>, "3h ago"], status: "good" },
          { cells: ["sitemap-products.xml", "Sitemap", "412", <span className="flex items-center gap-1 text-success"><RefreshCw className="size-3" /> Success</span>, "3h ago"], status: "good" },
          { cells: ["sitemap-images.xml", "Sitemap", "180", <span className="flex items-center gap-1 text-warning"><AlertCircle className="size-3" /> Couldn't fetch</span>, "2d ago"], status: "warn" },
          { cells: ["sitemap-news.xml", "Sitemap", "24", <span className="flex items-center gap-1 text-success"><RefreshCw className="size-3" /> Success</span>, "1h ago"], status: "good" },
        ]}
      />

      <div className="mt-6 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileCode className="size-4 text-primary" />
          <div className="text-sm font-semibold">robots.txt preview</div>
        </div>
        <pre className="text-xs font-mono bg-muted/30 rounded-2xl p-4 leading-relaxed overflow-auto">
{`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /tmp/
Disallow: /*.json$

Sitemap: https://acme.io/sitemap.xml`}
        </pre>
      </div>
    </ConsolePage>
  );
}