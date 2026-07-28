import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Globe, Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard } from "@/components/kpi-card";
import { ConsolePage, ConsoleFilters, ConsoleTable } from "@/components/search-console-page";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/_index")({
  head: () => ({ meta: [{ title: "Search Console — Nebula" }] }),
  component: Page,
});

const trend = Array.from({ length: 28 }, (_, i) => ({
  d: `${i + 1}`,
  clicks: Math.round(800 + Math.sin(i / 3) * 200 + i * 14),
  impressions: Math.round(18000 + Math.cos(i / 3) * 1200 + i * 180),
}));

const countries = [
  { name: "USA", a: 14200, b: 13400 },
  { name: "India", a: 6800, b: 6100 },
  { name: "UK", a: 3200, b: 3050 },
  { name: "Canada", a: 1800, b: 1700 },
  { name: "Germany", a: 1500, b: 1480 },
];

function Page() {
  return (
    <ConsolePage
      eyebrow="Section 11 · Search Console"
      title="Search Console Dashboard"
      description="Live signals from Google Search Console — clicks, impressions, CTR, position, coverage, and health at a glance."
    >
      <ConsoleFilters />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total clicks" value={24830} delta={5.4} hint="Last 28 days" />
        <KpiCard label="Impressions" value={482600} delta={3.2} hint="Last 28 days" />
        <KpiCard label="Avg. CTR" value={5.1} unit="%" delta={0.6} hint="Industry avg 3.4%" />
        <KpiCard label="Avg. Position" value={12.8} delta={-1.4} hint="Lower is better" ring={false} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Performance</div>
              <div className="text-lg font-semibold">Clicks vs impressions</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="clicksG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="impG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="impressions" stroke="var(--color-accent)" fill="url(#impG)" strokeWidth={2} />
                <Area type="monotone" dataKey="clicks" stroke="var(--color-primary)" fill="url(#clicksG)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Indexing</div>
          <div className="text-lg font-semibold mb-3">Coverage</div>
          <div className="space-y-3">
            {[
              { l: "Indexed", v: 1284, pct: 84, color: "bg-success", icon: CheckCircle2 },
              { l: "Excluded", v: 162, pct: 11, color: "bg-warning", icon: AlertCircle },
              { l: "Errors", v: 18, pct: 1.2, color: "bg-destructive", icon: AlertCircle },
              { l: "Valid w/ warnings", v: 64, pct: 4.2, color: "bg-muted-foreground", icon: Activity },
            ].map((x) => (
              <div key={x.l}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5">
                    <x.icon className="size-3.5 text-muted-foreground" /> {x.l}
                  </span>
                  <span className="font-semibold">{x.v.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${x.pct}%` }} transition={{ duration: 0.9 }} className={`h-full ${x.color} rounded-full`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-3">Top queries</div>
          <ConsoleTable
            columns={["Query", "Clicks", "Impressions", "CTR", "Pos."]}
            rows={[
              { cells: ["ai marketing automation", "1,204", "32,800", "3.7%", "4.2"], status: "good" },
              { cells: ["enterprise seo platform", "912", "18,200", "5.0%", "3.1"], status: "good" },
              { cells: ["best crm software", "754", "24,100", "3.1%", "6.8"], status: "warn" },
              { cells: ["digital marketing dashboard", "612", "12,400", "4.9%", "5.4"], status: "good" },
              { cells: ["seo audit tool", "484", "31,800", "1.5%", "8.1"], status: "high" },
            ]}
          />
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-3">By country</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="a" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="b" fill="var(--color-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="size-4 text-primary" />
          <div className="text-lg font-semibold">Property verification status</div>
          <StatusBadge status="connected" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Property <strong>https://acme.io/</strong> verified via DNS TXT record · Owner: Ava Kepler ·
          Last sync 3 minutes ago · All API scopes granted.
        </p>
      </div>
    </ConsolePage>
  );
}