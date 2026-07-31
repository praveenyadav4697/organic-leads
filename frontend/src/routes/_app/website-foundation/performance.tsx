import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Zap, Image as ImageIcon, FileCode, Database, Globe, Sparkles } from "lucide-react";
import { VitalsRing } from "@/modules/website-foundation/components/vitals-ring";
import { performanceService } from "@/modules/website-foundation/services";
import type { CoreVitals } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { TrendChart } from "@/modules/website-foundation/components/charts";

export const Route = createFileRoute("/_app/website-foundation/performance")({
  head: () => ({ meta: [{ title: "Performance | Organic Leads" }] }),
  component: PerformanceCenter,
});

function PerformanceCenter() {
  const [vitals, setVitals] = useState<CoreVitals | null>(null);
  const [recs, setRecs] = useState<string[]>([]);
  useEffect(() => {
    performanceService.vitals().then(setVitals);
    performanceService.recommendations().then(setRecs);
  }, []);

  if (!vitals) return <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <VitalsRing label="LCP" value={vitals.lcp} target={2.5} unit="s" intent="success" />
        <VitalsRing label="CLS" value={vitals.cls} target={0.1} unit="" intent="success" />
        <VitalsRing label="INP" value={vitals.inp} target={200} unit="ms" intent="warning" />
        <VitalsRing label="TTFB" value={vitals.ttfb} target={600} unit="ms" intent="success" />
        <VitalsRing label="Speed Index" value={vitals.speedIndex} target={3.4} unit="s" intent="success" />
        <VitalsRing label="Page size" value={vitals.pageSize} target={2.0} unit="MB" intent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Zap className="size-4 text-primary" /> Core Web Vitals trend</div>
          <TrendChart
            data={[
              { label: "Jan", value: 78 },
              { label: "Feb", value: 81 },
              { label: "Mar", value: 85 },
              { label: "Apr", value: 87 },
              { label: "May", value: 90 },
              { label: "Jun", value: 92 },
              { label: "Jul", value: 94 },
            ]}
          />
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Recommendations</div>
          <div className="mt-3 space-y-2">
            {recs.map((r) => (
              <div key={r} className="rounded-xl border border-border p-3 bg-muted/20 flex items-start gap-2">
                <Pill intent="info">Tip</Pill>
                <span className="text-sm">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: "Compression", v: "Brotli", icon: Globe, hint: "Active at edge" },
          { l: "Caching", v: "1y / 1h", icon: Database, hint: "Static / HTML" },
          { l: "CDN", v: "Cloudflare", icon: Globe, hint: "320 POPs" },
          { l: "Images", v: "AVIF + WebP", icon: ImageIcon, hint: "Auto-served" },
          { l: "JavaScript", v: "124 KB", icon: FileCode, hint: "Code-split" },
          { l: "CSS", v: "32 KB", icon: FileCode, hint: "Critical inlined" },
          { l: "Fonts", v: "Inter Variable", icon: FileCode, hint: "Preloaded" },
          { l: "HTTP/3", v: "Enabled", icon: Globe, hint: "0-RTT" },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <c.icon className="size-3.5" /> {c.l}
            </div>
            <div className="mt-2 text-base font-semibold">{c.v}</div>
            <div className="text-xs text-muted-foreground">{c.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
