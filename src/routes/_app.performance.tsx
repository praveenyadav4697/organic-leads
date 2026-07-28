import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { motion } from "framer-motion";
import { vitals } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { ProgressRing } from "@/components/kpi-card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/performance")({
  head: () => ({ meta: [{ title: "Performance Center — Nebula" }] }),
  component: Performance,
});

const trend = Array.from({ length: 14 }, (_, i) => ({ d: i + 1, lcp: 1.2 + Math.sin(i / 2) * 0.2 + i * 0.02, inp: 160 + Math.cos(i / 2) * 15 }));

const radarPerf = [
  { area: "Perf", score: 94 },
  { area: "A11y", score: 88 },
  { area: "SEO", score: 92 },
  { area: "Best Prac.", score: 96 },
  { area: "PWA", score: 78 },
];

const optim = [
  { l: "Compression (Brotli)", v: 92 },
  { l: "Caching headers", v: 88 },
  { l: "Image optimization", v: 74 },
  { l: "CSS minification", v: 96 },
  { l: "JavaScript bundling", v: 81 },
  { l: "Database optimization", v: 86 },
  { l: "CDN", v: 98 },
  { l: "Lazy loading", v: 92 },
];

function Performance() {
  return (
    <div>
      <PageHeader
        eyebrow="Section 6"
        title="Performance Center"
        description="Every millisecond, every metric. Lighthouse + Core Web Vitals + the full optimization stack."
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        {[
          { l: "Performance", v: 94, c: "text-primary" },
          { l: "Accessibility", v: 88, c: "text-accent" },
          { l: "Best Practices", v: 96, c: "text-success" },
          { l: "SEO", v: 92, c: "text-warning-foreground" },
          { l: "PWA", v: 78, c: "text-muted-foreground" },
        ].map((c, i) => (
          <motion.div
            key={c.l}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center text-center"
          >
            <ProgressRing value={c.v} size={92} />
            <div className={`mt-3 text-2xl font-semibold ${c.c}`}>{c.v}</div>
            <div className="text-xs text-muted-foreground">{c.l}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {vitals.map((v, i) => (
          <motion.div
            key={v.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 card-hover"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{v.name}</div>
              <StatusBadge status={v.status} />
            </div>
            <div className="text-3xl font-semibold tracking-tight">{v.value}<span className="text-sm text-muted-foreground ml-0.5">{v.unit}</span></div>
            <div className="text-[11px] text-muted-foreground mt-1">target ≤ {v.target}{v.unit}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">14-day vitals trend</div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="d" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Line type="monotone" dataKey="lcp" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="inp" stroke="var(--color-accent)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Lighthouse radar</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarPerf}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="area" fontSize={11} stroke="var(--color-muted-foreground)" />
                <Radar dataKey="score" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Optimization scoreboard</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {optim.map((x) => (
              <div key={x.l}>
                <div className="flex justify-between text-xs mb-1"><span>{x.l}</span><span className="font-semibold">{x.v}</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${x.v}%` }} transition={{ duration: 0.9 }} className="h-full gradient-primary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-primary" />
            <div className="text-sm font-semibold">AI recommendations</div>
          </div>
          <div className="space-y-3">
            {[
              "Convert 12 hero images to AVIF to save 240KB",
              "Defer 4 third-party scripts on /pricing",
              "Split vendor bundle at 240KB boundary",
              "Preconnect to fonts.gstatic.com",
              "Enable HTTP/3 on edge to reduce TTFB",
              "Inline critical CSS to eliminate render-blocking",
            ].map((t) => (
              <div key={t} className="rounded-2xl p-3.5 bg-card/80 border border-border text-xs leading-relaxed">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}