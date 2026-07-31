import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Globe } from "lucide-react";
import { ConsolePage } from "@/components/search-console-page";
import { StatusBadge } from "@/components/status-badge";

export const Route = createFileRoute("/_app/search-console/property-details")({
  head: () => ({ meta: [{ title: "Property Details | Organic Leads" }] }),
  component: Page,
});

function Page() {
  return (
    <ConsolePage title="Property Details" description="Verified property settings, ownership, and connected users.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 space-y-4">
          {[
            { l: "Property URL", v: "https://Organic Leads.io/" },
            { l: "Verification method", v: "DNS TXT record" },
            { l: "Verified on", v: "Jan 14, 2024" },
            { l: "Owner", v: "User (ava@Organic Leads.io)" },
            { l: "Owners", v: "4 · Full permission" },
            { l: "Users", v: "12 · Read-only / full" },
            { l: "API scopes", v: "searchconsole, analytics, index, adwords" },
            { l: "Last sync", v: "3 minutes ago" },
          ].map((r) => (
            <div key={r.l} className="grid grid-cols-3 gap-3 items-center text-sm">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{r.l}</div>
              <div className="col-span-2 font-medium">{r.v}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="size-4 text-primary" />
              <div className="text-sm font-semibold">Property</div>
            </div>
            <div className="text-2xl font-semibold mt-2">Organic Leads.io</div>
            <div className="mt-2"><StatusBadge status="connected" /></div>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="size-4 text-primary" />
              <div className="text-sm font-semibold">Health</div>
            </div>
            <div className="text-3xl font-semibold mt-2 gradient-text">98%</div>
            <div className="text-xs text-muted-foreground">All systems nominal</div>
          </div>
        </div>
      </div>
    </ConsolePage>
  );
}