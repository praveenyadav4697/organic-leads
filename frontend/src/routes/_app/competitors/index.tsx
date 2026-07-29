import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { competitors } from "@/lib/mock-data";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

export const Route = createFileRoute("/_app/competitors/")({
  head: () => ({ meta: [{ title: "Competitor Intelligence — Nebula" }] }),
  component: Competitors,
});

function Competitors() {
  return (
    <div>
      <PageHeader
        eyebrow="Section 4"
        title="Competitor Intelligence"
        description="Track competitor traffic, authority, keyword overlap, backlink gaps, content gaps — with AI-generated action recommendations."
        actions={<Button className="rounded-xl h-10">+ Add competitor</Button>}
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 rounded-xl h-11" placeholder="Add competitor domain…" />
        </div>
        <Button className="rounded-xl h-11 gradient-primary text-white border-0"><Sparkles className="size-4" /> AI find rivals</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[
          { l: "Tracked", v: "12" },
          { l: "Avg. DA", v: "78" },
          { l: "Avg. traffic", v: "8.4M" },
          { l: "Keyword gap", v: "1,284" },
          { l: "Backlink gap", v: "412" },
          { l: "Content gap", v: "32" },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
            <div className="text-2xl font-semibold mt-2">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitors.map((c, i) => (
            <motion.div
              key={c.domain}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-5 card-hover"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.domain}</div>
                </div>
                <div
                  className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
                    c.delta >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {c.delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                  {c.delta > 0 ? "+" : ""}{c.delta}%
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <Cell label="Traffic" value={`${(c.traffic / 1_000_000).toFixed(1)}M`} />
                <Cell label="Authority" value={`${c.da}`} />
                <Cell label="Keywords" value={`${(c.kw / 1000).toFixed(0)}k`} />
                <Cell label="Backlinks" value="84.2k" />
                <Cell label="Paid traffic" value="1.4M" />
                <Cell label="Top pages" value="412" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-success/8 text-success p-2">
                  <div className="font-semibold uppercase tracking-wider text-[10px] mb-0.5">Strength</div>
                  Deep integrations · Category authority
                </div>
                <div className="rounded-lg bg-destructive/8 text-destructive p-2">
                  <div className="font-semibold uppercase tracking-wider text-[10px] mb-0.5">Weakness</div>
                  Slow onboarding · Legacy UI
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-8 rounded-xl gradient-primary grid place-items-center"><Sparkles className="size-4 text-white" /></div>
            <div className="text-sm font-semibold">AI recommendations</div>
          </div>
          <div className="space-y-3">
            {[
              "Attack SEMrush on 'AI marketing automation' — you already have the topical authority.",
              "Publish comparison pages targeting HubSpot alternatives for enterprise buyers.",
              "Build 8 backlinks from category-leading SaaS blogs to close the DA gap with Ahrefs.",
              "Refresh top 5 pages losing rankings to helix.ai this month.",
              "Create FAQ pages targeting 32 content gaps you share with Moz.",
            ].map((t, i) => (
              <div key={i} className="rounded-2xl p-3.5 bg-card/80 border border-border text-xs leading-relaxed">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Keyword gap analysis</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitors.map((c) => ({ name: c.name, kw: c.kw / 1000, you: 620 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={11} stroke="var(--color-muted-foreground)" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="kw" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="you" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Backlink gap</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { d: "Referring domains", a: 92, b: 78 },
                { d: "Authority", a: 84, b: 70 },
                { d: "Diversity", a: 76, b: 80 },
                { d: "Anchor text", a: 88, b: 72 },
                { d: "Dofollow", a: 90, b: 76 },
                { d: "Topical relevance", a: 82, b: 74 },
              ]}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="d" fontSize={11} stroke="var(--color-muted-foreground)" />
                <Radar dataKey="a" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.3} />
                <Radar dataKey="b" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.2} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">SWOT analysis</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {[
            { l: "Strengths", color: "bg-success/10 text-success", items: ["Topical authority on AI", "Enterprise-grade stack", "Strong brand entity"] },
            { l: "Weaknesses", color: "bg-destructive/10 text-destructive", items: ["Limited video content", "Slow content velocity", "Lower DA than incumbents"] },
            { l: "Opportunities", color: "bg-primary/10 text-primary", items: ["AI Overview citations", "Comparison pages vs SEMrush", "Localized SERP wins"] },
            { l: "Threats", color: "bg-warning/15 text-warning-foreground", items: ["HubSpot launching AI suite", "New entrants like helix.ai", "Google Helpful Content shifts"] },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl border border-border p-4 bg-muted/20">
              <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${s.color} mb-3`}>{s.l}</div>
              <ul className="space-y-2 text-xs leading-relaxed">
                {s.items.map((it) => (
                  <li key={it} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 rounded-full bg-current shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
    </div>
  );
}