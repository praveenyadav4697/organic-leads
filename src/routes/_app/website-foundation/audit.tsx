import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Link2, Image as ImageIcon, Hash, ListTree, Globe, FileCode, Map, Share2, Twitter, AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/kpi-card";
import { auditService } from "@/modules/website-foundation/services";
import type { AuditResult } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { AISection } from "@/modules/website-foundation/components/ai-section";

export const Route = createFileRoute("/_app/website-foundation/audit")({
  head: () => ({ meta: [{ title: "Website Audit — Nebula" }] }),
  component: WebsiteAudit,
});

function WebsiteAudit() {
  const [audit, setAudit] = useState<AuditResult | null>(null);
  useEffect(() => { auditService.get().then(setAudit); }, []);
  if (!audit) return <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />;

  const scores = [
    { l: "Overall", v: audit.overall, icon: ShieldCheck },
    { l: "SEO", v: audit.seo, icon: Search },
    { l: "Performance", v: audit.performance, icon: Globe },
    { l: "Security", v: audit.security, icon: ShieldCheck },
    { l: "Accessibility", v: audit.accessibility, icon: ShieldCheck },
    { l: "Best practices", v: audit.bestPractices, icon: ListTree },
  ];

  const checks = [
    { l: "Broken links", v: audit.brokenLinks, icon: Link2, intent: audit.brokenLinks > 0 ? "warning" : "success" },
    { l: "404 errors", v: audit.errors404, icon: AlertTriangle, intent: audit.errors404 > 0 ? "warning" : "success" },
    { l: "500 errors", v: audit.errors500, icon: AlertTriangle, intent: audit.errors500 > 0 ? "danger" : "success" },
    { l: "Redirects", v: audit.redirects, icon: Link2, intent: "info" },
    { l: "Meta", v: audit.meta, icon: Hash, intent: "success" },
    { l: "Headings", v: audit.headings, icon: Hash, intent: "success" },
    { l: "Images", v: audit.images, icon: ImageIcon, intent: audit.images < 80 ? "warning" : "success" },
    { l: "Schema", v: audit.schema, icon: FileCode, intent: "success" },
    { l: "Canonical", v: audit.canonical, icon: FileCode, intent: "success" },
    { l: "Robots", v: audit.robots, icon: FileCode, intent: "success" },
    { l: "Sitemap", v: audit.sitemap, icon: Map, intent: "success" },
    { l: "Open Graph", v: audit.openGraph, icon: Share2, intent: audit.openGraph < 80 ? "warning" : "success" },
    { l: "Twitter cards", v: audit.twitterCards, icon: Twitter, intent: audit.twitterCards < 80 ? "warning" : "success" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Overall audit</div>
            <div className="text-3xl font-semibold mt-1">{audit.overall} <span className="text-base text-muted-foreground">/ 100</span></div>
            <div className="text-sm text-muted-foreground mt-1">Last completed · 2026-07-28 · 6m 12s</div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl">Export PDF</Button>
            <Button className="rounded-xl gradient-primary text-white border-0">Re-run audit</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {scores.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <ProgressRing value={s.v} size={48} />
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
              <div className="text-lg font-semibold">{s.v}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {checks.map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <c.icon className="size-3.5" /> {c.l}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-semibold">{c.v}</span>
              <Pill intent={c.intent as "success" | "warning" | "danger" | "info"}>{c.intent === "success" ? "Pass" : c.intent === "warning" ? "Review" : c.intent === "danger" ? "Crit" : "Info"}</Pill>
            </div>
          </div>
        ))}
      </div>

      <AISection title="AI recommendations" kind="recommendation" />
    </div>
  );
}
