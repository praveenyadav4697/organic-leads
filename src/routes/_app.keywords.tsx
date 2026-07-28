import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Sparkles, TrendingUp, HelpCircle, MapPin, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/keywords")({
  head: () => ({ meta: [{ title: "Keyword Intelligence — Nebula" }] }),
  component: Keywords,
});

const keywords = [
  { k: "ai marketing automation", vol: 22400, kd: 62, cpc: 12.4, intent: "Commercial", opp: 88, type: "Primary", trend: "up" },
  { k: "ai marketing automation platform", vol: 8200, kd: 48, cpc: 10.8, intent: "Commercial", opp: 82, type: "Secondary", trend: "up" },
  { k: "what is ai marketing automation", vol: 1810, kd: 22, cpc: 2.1, intent: "Informational", opp: 94, type: "Question", trend: "up" },
  { k: "ai marketing automation for b2b", vol: 1900, kd: 41, cpc: 9.4, intent: "Commercial", opp: 76, type: "Long-tail", trend: "up" },
  { k: "enterprise marketing automation", vol: 14800, kd: 71, cpc: 16.2, intent: "Commercial", opp: 64, type: "Primary", trend: "flat" },
  { k: "marketing automation consultant", vol: 5400, kd: 58, cpc: 24.1, intent: "Transactional", opp: 71, type: "Long-tail", trend: "up" },
  { k: "marketing automation saas", vol: 9800, kd: 64, cpc: 18.4, intent: "Commercial", opp: 69, type: "LSI", trend: "flat" },
  { k: "ai marketing automation ai marketing", vol: 880, kd: 28, cpc: 4.2, intent: "Informational", opp: 86, type: "LSI", trend: "up" },
  { k: "ai marketing automation new york", vol: 720, kd: 36, cpc: 14.1, intent: "Local", opp: 79, type: "Location", trend: "up" },
  { k: "best ai marketing automation 2026", vol: 1200, kd: 44, cpc: 8.1, intent: "Commercial", opp: 84, type: "Question", trend: "up" },
];

const clusters = [
  { name: "AI Marketing Automation", count: 124, vol: 284000, opp: 88 },
  { name: "Enterprise SEO", count: 84, vol: 168000, opp: 81 },
  { name: "Core Web Vitals", count: 62, vol: 92000, opp: 94 },
  { name: "Search Console", count: 48, vol: 54000, opp: 86 },
];

function Keywords() {
  return (
    <div>
      <PageHeader
        eyebrow="Section 3"
        title="Keyword Intelligence"
        description="Describe your business. Get an entire keyword universe — primary, secondary, long-tail, LSI, question, and location — ranked by real opportunity."
        actions={
          <>
            <Button variant="outline" className="rounded-xl h-10"><Download className="size-4" /> Export CSV</Button>
            <Button variant="outline" className="rounded-xl h-10"><Download className="size-4" /> Export Excel</Button>
            <Button variant="outline" className="rounded-xl h-10"><FileText className="size-4" /> Export PDF</Button>
          </>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Seed keyword or topic" defaultValue="ai marketing automation" className="rounded-xl h-11 md:col-span-2" />
          <Input placeholder="Country" defaultValue="United States" className="rounded-xl h-11" />
          <Input placeholder="Language" defaultValue="English" className="rounded-xl h-11" />
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted-foreground">Powered by Nebula Copilot · GPT-4o class</div>
          <Button className="rounded-xl h-11 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
            <Sparkles className="size-4" /> Generate keywords
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Primary keywords", v: "32", i: Sparkles, color: "text-primary" },
          { l: "Long-tail keywords", v: "184", i: FileText, color: "text-accent" },
          { l: "Question keywords", v: "62", i: HelpCircle, color: "text-warning" },
          { l: "Location keywords", v: "48", i: MapPin, color: "text-success" },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
              <c.i className={`size-4 ${c.color}`} />
            </div>
            <div className="text-3xl font-semibold mt-2">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden mb-6">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="text-lg font-semibold">Keyword universe · {keywords.length}</div>
          <div className="flex items-center gap-2">
            <select className="px-3 py-1.5 rounded-xl text-xs border border-border bg-card">
              <option>All types</option>
              <option>Primary</option>
              <option>Secondary</option>
              <option>Long-tail</option>
              <option>LSI</option>
              <option>Question</option>
              <option>Location</option>
            </select>
            <Input placeholder="Filter keywords…" className="rounded-xl h-9 text-xs w-[200px]" />
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Keyword</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Volume</th>
                <th className="text-left px-4 py-3 font-medium">KD</th>
                <th className="text-left px-4 py-3 font-medium">CPC</th>
                <th className="text-left px-4 py-3 font-medium">Intent</th>
                <th className="text-left px-4 py-3 font-medium">SERP features</th>
                <th className="text-left px-4 py-3 font-medium">Opp.</th>
                <th className="text-left px-4 py-3 font-medium">Trend</th>
                <th className="text-right px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keywords.map((k, i) => (
                <motion.tr
                  key={k.k}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="hover:bg-muted/30 transition"
                >
                  <td className="px-4 py-3 font-medium truncate max-w-[260px]">{k.k}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted/40 px-2 py-0.5 text-[11px] font-medium">{k.type}</span>
                  </td>
                  <td className="px-4 py-3">{k.vol.toLocaleString()}</td>
                  <td className="px-4 py-3">{k.kd}</td>
                  <td className="px-4 py-3">${k.cpc.toFixed(1)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{k.intent}</td>
                  <td className="px-4 py-3 text-muted-foreground text-[11px]">PAA · FS</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{k.opp}</span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full gradient-primary rounded-full" style={{ width: `${k.opp}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TrendingUp className={`size-3.5 ${k.trend === "up" ? "text-success" : "text-muted-foreground"}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" className="rounded-lg text-xs">Track</Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Keyword clusters</div>
          <div className="space-y-3">
            {clusters.map((c) => (
              <div key={c.name} className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <span className="text-[11px] text-muted-foreground">{c.count} keywords</span>
                  <div className="ml-auto text-xs font-semibold">{c.vol.toLocaleString()} vol</div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${c.opp}%` }} transition={{ duration: 0.9 }} className="h-full gradient-primary rounded-full" />
                </div>
                <div className="text-[11px] text-muted-foreground mt-2">Opportunity score: {c.opp}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-primary" />
            <div className="text-sm font-semibold">AI keyword recommendations</div>
          </div>
          <div className="space-y-3">
            {[
              { t: "Target 'ai marketing automation for b2b' — low KD, high intent.", a: "+12 qualified leads / mo" },
              { t: "Build pillar on 'AI marketing automation' and link 8 question cluster pages.", a: "+184% topical authority" },
              { t: "Add 'best ai marketing automation 2026' as Q4 PAA target.", a: "Capture 1,200 monthly searches" },
              { t: "Localize top 10 keywords for NYC, London, Berlin markets.", a: "+32% local SERP presence" },
            ].map((r) => (
              <div key={r.t} className="rounded-2xl p-3.5 bg-card/80 border border-border">
                <div className="text-xs leading-relaxed">{r.t}</div>
                <div className="text-[11px] text-primary mt-2 font-medium">{r.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}