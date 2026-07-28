import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Play, Pencil, Trash2, Search, Globe, Database, Server, Shield,
  Layers, Cpu, HardDrive, Download, RefreshCw, Clock, Camera,
} from "lucide-react";
import { websites } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { motion } from "framer-motion";
import { ProgressRing } from "@/components/kpi-card";

export const Route = createFileRoute("/_app/website-foundation")({
  head: () => ({ meta: [{ title: "Website Foundation — Nebula" }] }),
  component: WebsiteFoundation,
});

function WebsiteFoundation() {
  return (
    <div>
      <PageHeader
        eyebrow="Section 1"
        title="Website Foundation"
        description="Every property, every stack. Register, monitor, and audit your entire digital footprint from one place."
        actions={
          <>
            <Button variant="outline" className="rounded-xl h-10">
              <Play className="size-4" /> Run audit
            </Button>
            <Button className="rounded-xl h-10 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
              <Plus className="size-4" /> Add website
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 rounded-xl h-10" placeholder="Search domains…" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {websites.map((w, i) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border bg-card p-5 card-hover"
          >
            <div className="flex items-start gap-3">
              <div className="size-11 rounded-xl gradient-primary grid place-items-center shrink-0">
                <Globe className="size-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{w.domain}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{w.cms} · {w.hosting}</div>
              </div>
              <ProgressRing value={w.health} size={44} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="Health" value={`${w.health}%`} />
              <Stat label="Issues" value={String(w.issues)} />
              <Stat label="Updated" value={w.updated} />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <StatusBadge status={w.health > 85 ? "good" : "warn"} />
              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-lg size-8"><Pencil className="size-3.5" /></Button>
                <Button variant="ghost" size="icon" className="rounded-lg size-8"><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Globe className="size-4 text-primary" /> Domain & Hosting
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { l: "Domain", v: "acme.io" },
              { l: "Registrar", v: "Cloudflare" },
              { l: "Hosting", v: "Vercel · Edge" },
              { l: "DNS", v: "Cloudflare" },
              { l: "SSL", v: "A+ · Auto-renew" },
              { l: "WHOIS", v: "Privacy on" },
              { l: "Server location", v: "Iowa · EU-WEST" },
              { l: "IP", v: "104.21.x.x" },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                <div className="text-sm font-medium mt-1 truncate">{c.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Camera className="size-4 text-primary" /> Website screenshot
          </div>
          <div className="aspect-video rounded-2xl bg-muted/30 border border-border grid place-items-center relative overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-10" />
            <div className="relative text-center">
              <div className="text-xs font-semibold">acme.io · 1440×900</div>
              <div className="text-[11px] text-muted-foreground">Captured 2 minutes ago</div>
              <Button size="sm" variant="outline" className="rounded-lg mt-3">Re-capture</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Layers className="size-4 text-primary" /> Technology stack
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { l: "CMS", v: "Next.js 15" },
              { l: "Theme version", v: "design v3" },
              { l: "WordPress version", v: "—" },
              { l: "PHP version", v: "—" },
              { l: "Database", v: "Postgres 16" },
              { l: "CDN", v: "Cloudflare" },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                <div className="text-sm font-medium mt-1 truncate">{c.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Cpu className="size-4 text-primary" /> Server resources
          </div>
          <div className="space-y-3">
            {[
              { l: "Storage usage", v: 62, color: "gradient-primary" },
              { l: "CPU usage", v: 38, color: "gradient-primary" },
              { l: "Memory usage", v: 71, color: "gradient-primary" },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex justify-between text-xs mb-1"><span>{m.l}</span><span className="font-semibold">{m.v}%</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.9 }} className={`h-full ${m.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold flex items-center gap-2">
              <HardDrive className="size-4 text-primary" /> Plugin list
            </div>
            <Button size="sm" variant="outline" className="rounded-lg">Manage</Button>
          </div>
          <div className="space-y-2">
            {[
              { n: "Rank Math SEO", v: "v1.0.220", s: "good" as const },
              { n: "WP Rocket", v: "v3.16", s: "good" as const },
              { n: "Elementor Pro", v: "v3.24", s: "warn" as const },
              { n: "Wordfence", v: "v7.11", s: "good" as const },
              { n: "MonsterInsights", v: "v8.27", s: "good" as const },
            ].map((p) => (
              <div key={p.n} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <Database className="size-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.n}</div>
                  <div className="text-[11px] text-muted-foreground">{p.v}</div>
                </div>
                <StatusBadge status={p.s} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Download className="size-4 text-primary" /> Website backups
            </div>
            <Button size="sm" className="rounded-lg gradient-primary text-white border-0">Backup now</Button>
          </div>
          <div className="space-y-2">
            {[
              { date: "Today 03:00 UTC", size: "2.4 GB", s: "good" as const },
              { date: "Yesterday 03:00 UTC", size: "2.3 GB", s: "good" as const },
              { date: "2 days ago", size: "2.3 GB", s: "good" as const },
              { date: "3 days ago", size: "2.2 GB", s: "good" as const },
            ].map((b, i) => (
              <div key={b.date} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <HardDrive className="size-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.date}</div>
                  <div className="text-[11px] text-muted-foreground">{b.size}</div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-lg">Restore</Button>
                <StatusBadge status={b.s} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="size-4 text-primary" /> Deployment history
          </div>
          <div className="space-y-3">
            {[
              { v: "v3.12.0", t: "2h ago", a: "Ava Kepler", m: "Add CWV optimization" },
              { v: "v3.11.4", t: "1d ago", a: "Marcus Lane", m: "Hotfix: cookie banner" },
              { v: "v3.11.3", t: "3d ago", a: "CI", m: "Security patches" },
              { v: "v3.11.2", t: "5d ago", a: "Ivy Sun", m: "Refactor blog index" },
            ].map((d) => (
              <div key={d.v} className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-muted grid place-items-center shrink-0">
                  <Server className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{d.v} <span className="text-muted-foreground font-normal">· {d.t}</span></div>
                  <div className="text-xs text-muted-foreground">{d.m} — {d.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Shield className="size-4 text-primary" /> Audit history
          </div>
          <div className="space-y-3">
            {[
              { t: "SEO Audit · 87/100", s: "good", when: "Today" },
              { t: "Performance · 92/100", s: "good", when: "Today" },
              { t: "Security · A+", s: "good", when: "Yesterday" },
              { t: "Accessibility · 92/100", s: "warn", when: "2d ago" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <RefreshCw className="size-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.t}</div>
                  <div className="text-[11px] text-muted-foreground">{r.when}</div>
                </div>
                <StatusBadge status={r.s} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Audit summary</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: "Domain", v: "Verified · SSL A+" },
            { l: "Hosting", v: "Vercel · Edge" },
            { l: "CMS", v: "Next.js 15" },
            { l: "Theme", v: "Custom · design v3" },
            { l: "Plugins", v: "18 active" },
            { l: "Contact forms", v: "6 · all healthy" },
            { l: "Website speed", v: "1.4s LCP" },
            { l: "Responsive", v: "100% pass" },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-border p-4 bg-muted/30">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{x.l}</div>
              <div className="text-sm font-medium mt-1">{x.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold mt-0.5">{value}</div>
    </div>
  );
}