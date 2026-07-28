import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Play, RefreshCw, Database, Shield, Server, Cpu, HardDrive, Camera, Globe, Clock, Download, Rocket, History, Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressRing } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/modules/website-foundation/components/stat-cards";
import { websiteService } from "@/modules/website-foundation/services";
import type { Website } from "@/modules/website-foundation/types";
import { websiteQuickStats } from "@/modules/website-foundation/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website-foundation/overview")({
  head: () => ({ meta: [{ title: "Website Overview — Nebula" }] }),
  component: WebsiteOverview,
});

function WebsiteOverview() {
  const [site, setSite] = useState<Website | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    websiteService.get().then(setSite);
  }, []);

  if (!site) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const stats = websiteQuickStats(site);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Health" value={site.health} unit="%" delta={2.4} hint="All systems nominal" icon={Shield} intent="success" index={0} />
        <StatCard label="Performance" value={site.performance} unit="%" delta={1.8} hint="LCP 1.4s" icon={Rocket} intent="primary" index={1} />
        <StatCard label="SEO" value={site.seo} unit="%" delta={5.1} hint="3 quick wins available" icon={Globe} intent="info" index={2} />
        <StatCard label="Responsive" value={site.responsive} unit="%" delta={0.4} hint="Fully responsive" icon={Camera} intent="primary" index={3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl gradient-primary grid place-items-center text-white">
                <Globe className="size-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{site.name}</div>
                <div className="text-xs text-muted-foreground">{site.url} · {site.cms}</div>
              </div>
            </div>
            <StatusBadge status={site.health > 85 ? "good" : "warn"} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              { l: "Environment", v: site.environment, intent: "primary" as const },
              { l: "Status", v: site.status, intent: site.status === "online" ? "success" as const : "warning" as const },
              { l: "Last scan", v: new Date(site.lastScan).toLocaleString() },
              { l: "Next scheduled", v: new Date(site.nextScan).toLocaleString() },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                <div className="text-sm font-medium mt-0.5 capitalize">{c.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-3 rounded-xl h-10" placeholder="Search workloads, pages, audits…" />
            </div>
            <Button variant="outline" className="rounded-xl h-10"><RefreshCw className="size-4" /> Refresh</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Camera className="size-4 text-primary" /> Website screenshot</div>
          <div className="aspect-video rounded-2xl bg-muted/30 border border-border grid place-items-center relative overflow-hidden">
            <div className="absolute inset-0 gradient-primary opacity-10" />
            <div className="relative text-center">
              <div className="text-xs font-semibold">{site.url} · 1440×900</div>
              <div className="text-[11px] text-muted-foreground">Captured 2 minutes ago</div>
              <Button size="sm" variant="outline" className="rounded-lg mt-3">Re-capture</Button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Server className="size-4 text-primary" /> Domain & hosting</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { l: "Domain", v: site.domain },
              { l: "Registrar", v: site.registrar },
              { l: "Hosting", v: site.hosting },
              { l: "DNS", v: site.dns },
              { l: "SSL", v: site.ssl },
              { l: "WHOIS", v: site.whois },
              { l: "Server location", v: site.location },
              { l: "IP", v: site.ip },
              { l: "Uptime", v: site.uptime },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                <div className="text-sm font-medium mt-1 truncate">{c.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Cpu className="size-4 text-primary" /> Server resources</div>
          <div className="space-y-3">
            {[
              { l: "Storage usage", v: site.storage },
              { l: "CPU usage", v: site.cpu },
              { l: "Memory usage", v: site.memory },
              { l: "Disk usage", v: site.diskUsage },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex justify-between text-xs mb-1"><span>{m.l}</span><span className="font-semibold">{m.v}%</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.9 }} className="h-full gradient-primary rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border p-3 bg-muted/30 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Plugins</div>
              <div className="text-lg font-semibold mt-1">10</div>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/30 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Themes</div>
              <div className="text-lg font-semibold mt-1">5</div>
            </div>
            <div className="rounded-xl border border-border p-3 bg-muted/30 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Forms</div>
              <div className="text-lg font-semibold mt-1">6</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold flex items-center gap-2"><HardDrive className="size-4 text-primary" /> Plugin list</div>
            <Button size="sm" variant="outline" className="rounded-lg">Manage</Button>
          </div>
          <div className="space-y-2">
            {stats.plugins.map((p) => (
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
            <div className="text-sm font-semibold flex items-center gap-2"><Download className="size-4 text-primary" /> Website backups</div>
            <Button size="sm" className="rounded-lg gradient-primary text-white border-0">Backup now</Button>
          </div>
          <div className="space-y-2">
            {stats.backups.map((b) => (
              <div key={b.date} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <HardDrive className="size-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{b.date}</div>
                  <div className="text-[11px] text-muted-foreground">{b.size}</div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-lg">Restore</Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Clock className="size-4 text-primary" /> Deployment history</div>
          <div className="space-y-3">
            {stats.deployments.map((d) => (
              <div key={d.v} className="flex items-start gap-3">
                <div className="size-8 rounded-lg bg-muted grid place-items-center shrink-0"><Server className="size-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{d.v} <span className="text-muted-foreground font-normal">· {d.t}</span></div>
                  <div className="text-xs text-muted-foreground">{d.m} — {d.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Shield className="size-4 text-primary" /> Audit history</div>
          <div className="space-y-3">
            {stats.audit.map((r) => (
              <div key={r.t} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
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
            { l: "Hosting", v: site.hosting },
            { l: "CMS", v: site.cms },
            { l: "Theme", v: "Custom · design v3" },
            { l: "Plugins", v: "10 active" },
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
