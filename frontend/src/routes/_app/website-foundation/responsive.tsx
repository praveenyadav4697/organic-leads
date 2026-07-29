import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Monitor, Tablet, Smartphone, ExternalLink, Eye, AlertTriangle, CheckCircle2, Accessibility } from "lucide-react";
import { Button } from "@/components/ui/button";
import { responsiveService } from "@/modules/website-foundation/services";
import type { ResponsiveTest } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/website-foundation/responsive")({
  head: () => ({ meta: [{ title: "Responsive — Nebula" }] }),
  component: ResponsiveCenter,
});

const viewportIcons: Record<ResponsiveTest["viewport"], React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  laptop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
  landscape: Monitor,
  portrait: Smartphone,
};

function ResponsiveCenter() {
  const [tests, setTests] = useState<ResponsiveTest[]>([]);
  useEffect(() => { responsiveService.list().then(setTests); }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((t, i) => {
          const Icon = viewportIcons[t.viewport] || Monitor;
          const ratio =
            t.viewport === "desktop" ? "16:9" :
            t.viewport === "laptop" ? "16:10" :
            t.viewport === "tablet" ? "3:4" :
            t.viewport === "mobile" || t.viewport === "portrait" ? "9:19" :
            t.viewport === "landscape" ? "19:9" : "16:9";
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold capitalize">
                  <Icon className="size-4 text-primary" /> {t.viewport}
                </div>
                <Pill intent={t.pass ? "success" : "danger"}>{t.pass ? "Pass" : "Fail"}</Pill>
              </div>
              <div className="mt-3 rounded-xl border border-border bg-muted/30 relative overflow-hidden" style={{ aspectRatio: ratio.replace(":", " / ") }}>
                <div className="absolute inset-0 grid place-items-center text-muted-foreground text-xs">
                  {t.url} · {t.resolution}
                </div>
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-background/80">{t.resolution}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-background/80 capitalize">{t.viewport}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Issues</div>
                  <div className="text-xs font-semibold mt-0.5">{t.issues}</div>
                </div>
                <div className="rounded-lg bg-muted/40 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Touch</div>
                  <div className="text-xs font-semibold mt-0.5">{t.touchTargets || "—"}px</div>
                </div>
                <div className="rounded-lg bg-muted/40 py-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">A11y</div>
                  <div className="text-xs font-semibold mt-0.5">{t.accessibility}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" className="rounded-lg flex-1"><Camera className="size-3.5" /> Screenshot</Button>
                <Button size="sm" variant="ghost" className="rounded-lg"><Eye className="size-3.5" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="size-4 text-warning" /> Responsive issues</div>
          <div className="mt-4 space-y-2">
            {[
              { title: "Hero CTA tap target 36px on mobile", viewport: "mobile", severity: "medium" },
              { title: "Footer text wraps unexpectedly at 1280px", viewport: "laptop", severity: "low" },
              { title: "Landscape nav overlaps hero copy", viewport: "landscape", severity: "medium" },
              { title: "Image alt missing on /pricing hero", viewport: "tablet", severity: "low" },
            ].map((i, idx) => (
              <div key={idx} className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{i.title}</div>
                  <Pill intent={i.severity === "medium" ? "warning" : "info"}>{i.severity}</Pill>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 capitalize">{i.viewport}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Accessibility className="size-4 text-primary" /> Touch targets</div>
          <div className="mt-4 space-y-3">
            {[
              { l: "Primary CTA", v: 48, target: 44 },
              { l: "Nav links", v: 40, target: 44 },
              { l: "Form inputs", v: 48, target: 44 },
              { l: "Footer links", v: 36, target: 44 },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex justify-between text-xs mb-1"><span>{m.l}</span><span className={cn("font-semibold", m.v < m.target ? "text-warning" : "text-success")}>{m.v}px</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={"h-full rounded-full " + (m.v < m.target ? "bg-warning" : "gradient-primary")} style={{ width: `${Math.min(100, (m.v / 60) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Snapshot</div>
          <div className="mt-4 space-y-2">
            {[
              { l: "Captured", v: "2026-07-28 09:14" },
              { l: "Resolution", v: "1920×1080" },
              { l: "Viewport", v: "Desktop" },
              { l: "Navigation", v: "Functional" },
              { l: "Accessibility", v: "90 / 100" },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                <div className="text-sm font-medium mt-0.5">{c.v}</div>
              </div>
            ))}
            <Button variant="outline" className="rounded-xl w-full"><ExternalLink className="size-4" /> Open in browser</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
