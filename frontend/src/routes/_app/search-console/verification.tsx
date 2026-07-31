import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, Globe } from "lucide-react";
import { ConsolePage } from "@/components/search-console-page";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/verification")({
  head: () => ({ meta: [{ title: "Verification Status | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Verification Status" description="Choose how Google verifies ownership of your property.">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { l: "Verified", v: "Yes", i: CheckCircle2, s: "good" as const },
          { l: "Method", v: "DNS TXT", i: Globe, s: "good" as const },
          { l: "Token", v: "google-site-verif…2c1", i: ShieldCheck, s: "good" as const },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <div className="size-12 rounded-xl bg-muted grid place-items-center">
              <c.i className="size-5 text-primary" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
              <div className="text-xl font-semibold mt-1 truncate">{c.v}</div>
            </div>
            <div className="ml-auto"><StatusBadge status={c.s} /></div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-3">Available verification methods</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { l: "DNS TXT record", d: "Recommended. Add TXT to your DNS provider.", s: "good" as const },
            { l: "HTML file upload", d: "Upload an HTML file to your root directory.", s: "good" as const },
            { l: "HTML meta tag", d: "Add a <meta> tag in your <head>.", s: "good" as const },
            { l: "Google Analytics", d: "Use existing GA tracking code.", s: "good" as const },
          ].map((c) => (
            <div key={c.l} className="rounded-2xl border border-border p-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold">{c.l}</div>
                <div className="ml-auto"><StatusBadge status={c.s} /></div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{c.d}</div>
            </div>
          ))}
        </div>
      </div>
    </ConsolePage>
  );
}