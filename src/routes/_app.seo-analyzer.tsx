import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, CheckCircle2, AlertTriangle, XCircle, Sparkles, Download, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressRing } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/seo-analyzer")({
  head: () => ({
    meta: [{ title: "SEO Audit — Nebula" }],
  }),
  component: SeoAnalyzer,
});

const categories = [
  { name: "Meta Title", status: "good", note: "Optimal length · keyword present" },
  { name: "Meta Description", status: "warn", note: "Missing on 4 pages" },
  { name: "Canonical", status: "good", note: "Self-referential on 100%" },
  { name: "Robots", status: "good", note: "Correctly configured" },
  { name: "Sitemap", status: "good", note: "Submitted & indexed" },
  { name: "Headings", status: "warn", note: "Multiple H1s on /pricing" },
  { name: "Images", status: "warn", note: "12 images without alt" },
  { name: "ALT Tags", status: "warn", note: "Empty alt on 12 images" },
  { name: "Broken Links", status: "good", note: "No 4xx found" },
  { name: "Redirects", status: "good", note: "Clean 301 chain" },
  { name: "404 Errors", status: "good", note: "0 detected" },
  { name: "500 Errors", status: "good", note: "0 detected" },
  { name: "Internal Links", status: "good", note: "Balanced anchor distribution" },
  { name: "External Links", status: "good", note: "No broken outbound" },
  { name: "Structured Data", status: "high", note: "Product schema missing on 4 PDPs" },
  { name: "Open Graph", status: "good", note: "Validated on 96% of pages" },
  { name: "Twitter Cards", status: "good", note: "summary_large_image applied" },
  { name: "Schema", status: "warn", note: "Organization schema incomplete" },
  { name: "Duplicate Content", status: "good", note: "No canonical collisions" },
  { name: "Duplicate Meta", status: "warn", note: "12 pages share title" },
  { name: "Thin Content", status: "high", note: "8 pages < 300 words" },
  { name: "Page Speed", status: "good", note: "LCP 1.4s · INP 180ms" },
  { name: "Core Web Vitals", status: "good", note: "All green on mobile" },
  { name: "Accessibility", status: "warn", note: "8 contrast issues" },
  { name: "Security", status: "good", note: "HTTPS · HSTS · CSP" },
  { name: "HTTPS", status: "good", note: "A+ SSL Labs rating" },
];

function icon(s: string) {
  if (s === "good") return <CheckCircle2 className="size-4 text-success" />;
  if (s === "high") return <XCircle className="size-4 text-destructive" />;
  return <AlertTriangle className="size-4 text-warning-foreground" />;
}

function SeoAnalyzer() {
  return (
    <div>
      <PageHeader
        eyebrow="Section 5"
        title="Enterprise SEO Audit"
        description="Every technical, on-page, and structural SEO signal — analyzed, scored, and ranked by impact."
        actions={
          <>
            <Button variant="outline" className="rounded-xl h-10">
              <Download className="size-4" /> Export PDF
            </Button>
            <Button className="rounded-xl h-10 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
              <Sparkles className="size-4" /> Fix with AI
            </Button>
          </>
        }
      />

      <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Website URL</div>
            <Input defaultValue="https://acme.io" className="rounded-xl h-12 text-base" />
          </div>
          <Button className="rounded-xl h-12 px-6 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
            <Play className="size-4" /> Run audit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center"
        >
          <ProgressRing value={87} size={140} />
          <div className="mt-4 text-3xl font-semibold gradient-text">87</div>
          <div className="text-xs text-muted-foreground">SEO Score · Great</div>
        </motion.div>

        {[
          { l: "Critical", v: 2, color: "text-destructive" },
          { l: "Warnings", v: 8, color: "text-warning-foreground" },
          { l: "Passed", v: 184, color: "text-success" },
        ].map((c) => (
          <div key={c.l} className="rounded-3xl border border-border bg-card p-6">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
            <div className={`mt-3 text-3xl font-semibold ${c.color}`}>{c.v}</div>
            <div className="text-xs text-muted-foreground mt-1">across {categories.length} categories</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Audit categories · {categories.length}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {categories.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20"
              >
                {icon(c.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.note}</div>
                </div>
                <StatusBadge status={c.status === "good" ? "good" : c.status === "high" ? "high" : "warn"} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-xl gradient-primary grid place-items-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="text-sm font-semibold">AI SEO suggestions</div>
          </div>
          <div className="space-y-3">
            {[
              { t: "Add Product schema to PDPs", i: "High impact · +14% CTR expected" },
              { t: "Rewrite 8 thin pages or merge", i: "Recover Helpful Content penalty risk" },
              { t: "Add structured FAQ blocks to top 10", i: "Capture PAA and AI citations" },
              { t: "Fix 8 contrast violations on /blog", i: "Improve a11y score to 100" },
            ].map((t) => (
              <div key={t.t} className="rounded-2xl p-3.5 bg-card/80 border border-border">
                <div className="flex items-start gap-2">
                  <Zap className="size-3.5 text-primary mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <div className="font-medium">{t.t}</div>
                    <div className="text-muted-foreground mt-0.5">{t.i}</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg mt-2 h-7 text-[11px]">
                  Fix now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Priority fix queue</div>
        <div className="divide-y divide-border">
          {[
            { title: "Add Product schema on 4 PDPs", priority: "high", score: 82 },
            { title: "Rewrite 8 thin content pages", priority: "high", score: 79 },
            { title: "Resolve 8 accessibility contrast issues", priority: "medium", score: 74 },
            { title: "Add meta descriptions on 4 pages", priority: "medium", score: 68 },
            { title: "Consolidate duplicate meta titles", priority: "low", score: 60 },
          ].map((s) => (
            <div key={s.title} className="flex items-center gap-4 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{s.title}</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${s.score}%` }} transition={{ duration: 0.9 }} className="h-full gradient-primary rounded-full" />
                </div>
              </div>
              <StatusBadge status={s.priority} />
              <Button variant="outline" size="sm" className="rounded-lg">Fix now</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}