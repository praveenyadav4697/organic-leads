import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { motion } from "framer-motion";
import { useState } from "react";
import { Monitor, Tablet, Smartphone, Laptop, Square } from "lucide-react";
import { ProgressRing } from "@/components/kpi-card";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_app/mobile")({
  head: () => ({ meta: [{ title: "Mobile Readiness — Nebula" }] }),
  component: Mobile,
});

const devices = [
  { key: "desktop", label: "Desktop", icon: Monitor, w: 920, h: 540, ori: "Landscape" },
  { key: "laptop", label: "Laptop", icon: Laptop, w: 760, h: 480, ori: "Landscape" },
  { key: "tablet", label: "Tablet", icon: Tablet, w: 500, h: 640, ori: "Portrait" },
  { key: "mobile", label: "Mobile", icon: Smartphone, w: 300, h: 620, ori: "Portrait" },
];

const tests = [
  { l: "Viewport test", v: "Pass · meta-viewport correct", s: "good" as const },
  { l: "Touch target size", v: "94% of targets ≥ 44×44px", s: "good" as const },
  { l: "Font readability", v: "92% pass · 2 pages under 16px base", s: "warn" as const },
  { l: "Navigation test", v: "Hamburger menu accessible on all pages", s: "good" as const },
  { l: "Mobile performance", v: "CWV mobile 92 · LCP 2.1s", s: "good" as const },
  { l: "Mobile SEO", v: "Structured data, AMP-ready, hreflang OK", s: "good" as const },
  { l: "Accessibility (WCAG AA)", v: "94% pass · 8 contrast issues", s: "warn" as const },
  { l: "AMP", v: "42 valid AMP pages", s: "good" as const },
];

function Mobile() {
  const [d, setD] = useState("mobile");
  const dev = devices.find((x) => x.key === d)!;
  return (
    <div>
      <PageHeader
        eyebrow="Section 7"
        title="Mobile Readiness"
        description="See every viewport, every orientation, every device. Audit touch, navigation, performance, SEO, and accessibility."
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6 flex flex-col items-center text-center">
          <ProgressRing value={96} size={140} />
          <div className="mt-3 text-3xl font-semibold gradient-text">96</div>
          <div className="text-xs text-muted-foreground">Responsive Score</div>
          <div className="mt-4 grid grid-cols-2 gap-2 w-full text-xs">
            <Stat label="Viewport" value="✓ Passes" />
            <Stat label="Touch" value="94%" />
            <Stat label="Nav" value="✓" />
            <Stat label="A11y" value="92" />
          </div>
        </div>

        <div className="xl:col-span-3 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">Device preview</div>
            <div className="inline-flex rounded-xl border border-border p-1 bg-muted/40">
              {devices.map((x) => (
                <button
                  key={x.key}
                  onClick={() => setD(x.key)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition", d === x.key ? "bg-card shadow-sm font-semibold" : "text-muted-foreground")}
                >
                  <x.icon className="size-3.5" /> {x.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-muted/50 to-muted/20 p-6 grid place-items-center min-h-[480px]">
            <motion.div
              key={dev.key}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
              style={{ width: dev.w, maxWidth: "100%", height: dev.h }}
            >
              <div className="h-8 border-b border-border flex items-center gap-1 px-3 bg-muted/40">
                <div className="size-2 rounded-full bg-destructive/60" />
                <div className="size-2 rounded-full bg-warning/70" />
                <div className="size-2 rounded-full bg-success/70" />
                <div className="ml-3 text-[10px] text-muted-foreground truncate">acme.io · {dev.ori}</div>
              </div>
              <div className="p-4 space-y-3">
                <div className="h-6 w-1/2 rounded-md gradient-primary opacity-90" />
                <div className="h-3 w-full rounded-md bg-muted" />
                <div className="h-3 w-3/4 rounded-md bg-muted" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="h-16 rounded-lg bg-muted" />
                  <div className="h-16 rounded-lg bg-muted" />
                </div>
                <div className="h-24 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20" />
                <div className="h-3 w-2/3 rounded-md bg-muted" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4">Mobile test results</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tests.map((t) => (
              <div key={t.l} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <Square className="size-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{t.l}</div>
                  <div className="text-[11px] text-muted-foreground">{t.v}</div>
                </div>
                <StatusBadge status={t.s} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-primary" />
            <div className="text-sm font-semibold">AI responsive fixes</div>
          </div>
          <div className="space-y-3">
            {[
              "Increase base font size to 16px on /blog/[slug]",
              "Add min-height to 2 hero images to prevent CLS",
              "Bundle 3 mobile-only JS files",
              "Switch menu to bottom-sheet pattern on < 360px",
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2 text-left">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold mt-0.5">{value}</div>
    </div>
  );
}