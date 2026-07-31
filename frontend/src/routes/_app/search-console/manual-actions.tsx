import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { ConsolePage } from "@/components/search-console-page";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/manual-actions")({
  head: () => ({ meta: [{ title: "Manual Actions | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage
      title="Manual Actions & Security"
      description="Any Google-driven penalties, security issues, or AMP errors affecting your site."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { l: "Manual actions", v: "0 active", icon: ShieldCheck, s: "good" as const },
          { l: "Security issues", v: "0 detected", icon: ShieldCheck, s: "good" as const },
          { l: "AMP errors", v: "2 invalid", icon: AlertCircle, s: "warn" as const },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-muted grid place-items-center">
              <c.icon className={`size-5 ${c.s === "good" ? "text-success" : "text-warning"}`} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
              <div className="text-xl font-semibold mt-1">{c.v}</div>
            </div>
            <div className="ml-auto">
              <StatusBadge status={c.s} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-3">Manual action history</div>
        <div className="divide-y divide-border">
          {[
            { date: "Mar 2024", desc: "Pure spam — resolved", s: "low" as const },
            { date: "Aug 2023", desc: "Unnatural links — resolved", s: "low" as const },
          ].map((r) => (
            <div key={r.date} className="flex items-center gap-4 py-3.5">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{r.date}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
              <StatusBadge status={r.s} />
            </div>
          ))}
        </div>
      </div>
    </ConsolePage>
  );
}