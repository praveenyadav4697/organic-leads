import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadarChart,
  Radar,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { KpiCard } from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Play, Zap, TrendingUp } from "lucide-react";
import { kpis, trafficSeries, radarSeo, aiInsights, seoIssues } from "@/lib/mock-data";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Command Center — Nebula AI Marketing OS" },
      { name: "description", content: "Enterprise dashboard for AI-powered digital marketing automation: SEO, performance, tracking, and Google product health at a glance." },
      { property: "og:title", content: "Command Center — Nebula AI Marketing OS" },
      { property: "og:description", content: "Enterprise dashboard for AI-powered digital marketing automation." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div>
      <PageHeader
        eyebrow="Phase 1 · Digital Foundation"
        title="Command Center"
        description="A unified, AI-first view of your website health, SEO, performance, and Google ecosystem. Everything begins here."
        actions={
          <>
            <Button variant="outline" className="rounded-xl h-10">
              <Download className="size-4" /> Export
            </Button>
            <Button className="rounded-xl h-10 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
              <Play className="size-4" /> Run full audit
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 mb-6">
        {kpis.map((k, i) => {
          const { key, ...rest } = k;
          return <KpiCard key={key} {...rest} index={i} />;
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="xl:col-span-2 rounded-3xl border border-border bg-card p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Traffic overview</div>
              <div className="text-lg font-semibold mt-1">Sessions across channels</div>
            </div>
            <div className="inline-flex rounded-xl border border-border p-1 bg-muted/40 text-xs">
              {["7d", "30d", "90d", "12m"].map((t, i) => (
                <button
                  key={t}
                  className={`px-3 py-1 rounded-lg transition ${i === 2 ? "bg-card shadow-sm font-semibold" : "text-muted-foreground"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficSeries}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="organic" stroke="var(--color-primary)" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="paid" stroke="var(--color-accent)" strokeWidth={2} fill="url(#g2)" />
                <Area type="monotone" dataKey="direct" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#g3)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl border border-border bg-card p-6"
        >
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">SEO health radar</div>
          <div className="text-lg font-semibold mt-1 mb-2">Signal strength by dimension</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarSeo}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="area" fontSize={11} stroke="var(--color-muted-foreground)" />
                <PolarRadiusAxis stroke="var(--color-border)" tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.25} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Live audit</div>
              <div className="text-lg font-semibold mt-1">Priority issues to fix</div>
            </div>
            <Button variant="outline" className="rounded-xl">
              <Zap className="size-4" /> Auto-fix with AI
            </Button>
          </div>
          <div className="divide-y divide-border">
            {seoIssues.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 py-3.5"
              >
                <div className="size-9 rounded-xl bg-muted grid place-items-center">
                  <TrendingUp className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.title}</div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.score}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full gradient-primary rounded-full"
                    />
                  </div>
                </div>
                <StatusBadge status={s.priority} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border p-6 bg-gradient-to-br from-primary/5 via-card to-accent/5">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-xl gradient-primary grid place-items-center">
              <Sparkles className="size-4 text-white" />
            </div>
            <div className="text-sm font-semibold">AI insights</div>
          </div>
          <div className="space-y-3">
            {aiInsights.slice(0, 3).map((t, i) => (
              <div key={i} className="rounded-2xl p-3.5 bg-card/80 border border-border">
                <p className="text-xs leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
