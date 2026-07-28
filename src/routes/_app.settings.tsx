import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Copy, KeyRound, ShieldCheck, Bell, Building2, User } from "lucide-react";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Nebula" },
      { name: "description", content: "Manage profile, organization, notifications, API keys, integrations, security, and audit logs." },
      { property: "og:title", content: "Settings — Nebula" },
      { property: "og:description", content: "Organization-wide settings for Nebula AI Marketing OS." },
    ],
  }),
  component: Settings,
});

function Settings() {
  return (
    <div>
      <PageHeader eyebrow="Configuration" title="Settings" description="Manage everything about your workspace, security, and integrations." />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="rounded-xl bg-muted/50 p-1 h-auto flex-wrap">
          {[
            { v: "profile", l: "Profile", i: User },
            { v: "org", l: "Organization", i: Building2 },
            { v: "notif", l: "Notifications", i: Bell },
            { v: "api", l: "API Keys", i: KeyRound },
            { v: "sec", l: "Security", i: ShieldCheck },
          ].map((t) => (
            <TabsTrigger key={t.v} value={t.v} className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm px-3.5 py-1.5 text-xs">
              <t.i className="size-3.5" /> {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full name"><Input defaultValue="Ava Kepler" className="rounded-xl h-11" /></Field>
              <Field label="Email"><Input defaultValue="ava@acme.io" className="rounded-xl h-11" /></Field>
              <Field label="Role"><Input defaultValue="Admin" className="rounded-xl h-11" /></Field>
              <Field label="Timezone"><Input defaultValue="America/Los_Angeles" className="rounded-xl h-11" /></Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="org" className="mt-6">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Organization"><Input defaultValue="Acme Corporation" className="rounded-xl h-11" /></Field>
              <Field label="Plan"><Input defaultValue="Enterprise · Unlimited" className="rounded-xl h-11" /></Field>
              <Field label="Members"><Input defaultValue="42" className="rounded-xl h-11" /></Field>
              <Field label="Region"><Input defaultValue="US · EU · APAC" className="rounded-xl h-11" /></Field>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notif" className="mt-6">
          <Card>
            {["Weekly digest", "Audit finished", "Ranking changes", "Competitor movements", "Billing alerts"].map((n, i) => (
              <div key={n} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <div>
                  <div className="text-sm font-medium">{n}</div>
                  <div className="text-xs text-muted-foreground">Email + in-app</div>
                </div>
                <Switch defaultChecked={i < 3} />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card>
            <div className="text-sm font-semibold mb-3">Active keys</div>
            {[
              { k: "sk_live_a83f•••••2c1", n: "Production" },
              { k: "sk_test_00•••••••ff2", n: "Sandbox" },
            ].map((r) => (
              <div key={r.k} className="flex items-center gap-3 py-3 border-t border-border first:border-t-0">
                <KeyRound className="size-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{r.n}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.k}</div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg"><Copy className="size-3.5" /> Copy</Button>
              </div>
            ))}
            <Button className="mt-4 rounded-xl gradient-primary text-white border-0">Generate new key</Button>
          </Card>
        </TabsContent>

        <TabsContent value="sec" className="mt-6">
          <Card>
            {["Two-factor authentication", "SSO / SAML", "Session timeout · 30 min", "IP allowlist"].map((s, i) => (
              <div key={s} className={`flex items-center justify-between py-3 ${i > 0 ? "border-t border-border" : ""}`}>
                <div className="text-sm font-medium">{s}</div>
                <Switch defaultChecked={i < 2} />
              </div>
            ))}
          </Card>
          <div className="rounded-3xl border border-border bg-card p-6 mt-6">
            <div className="text-sm font-semibold mb-3">Audit log</div>
            <div className="space-y-2">
              {[
                "Ava K. exported keyword universe · 12m ago",
                "Marcus L. connected Google Ads · 1h ago",
                "System · nightly audit completed · 3h ago",
                "Ivy S. updated brand voice · yesterday",
              ].map((l) => (
                <div key={l} className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-3 py-1">{l}</div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-border bg-card p-6">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 block">{label}</Label>
      {children}
    </div>
  );
}
