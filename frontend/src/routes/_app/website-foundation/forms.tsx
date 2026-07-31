import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FormInput, Plus, Shield, Webhook, Mail, Inbox, Puzzle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnterpriseTable, type Column } from "@/modules/website-foundation/components/enterprise-table";
import { formService } from "@/modules/website-foundation/services";
import type { Form } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { Switch } from "@/modules/website-foundation/components/form-field";

export const Route = createFileRoute("/_app/website-foundation/forms")({
  head: () => ({ meta: [{ title: "Forms | Organic Leads" }] }),
  component: FormsCenter,
});

const groups: { title: string; icon: React.ComponentType<{ className?: string }>; type: Form["type"] }[] = [
  { title: "Contact forms", icon: Mail, type: "contact" },
  { title: "Newsletter forms", icon: Inbox, type: "newsletter" },
  { title: "Lead forms", icon: FormInput, type: "lead" },
  { title: "Popup forms", icon: Puzzle, type: "popup" },
];

function FormsCenter() {
  const [forms, setForms] = useState<Form[]>([]);
  useEffect(() => { formService.list().then(setForms); }, []);

  const columns: Column<Form>[] = [
    { id: "name", header: "Form", sortValue: (r) => r.name, accessor: (r) => (
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-muted/40 grid place-items-center text-primary"><FormInput className="size-4" /></div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{r.name}</div>
          <div className="text-[11px] text-muted-foreground capitalize">{r.type}</div>
        </div>
      </div>
    ) },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <Pill intent={r.status === "active" ? "success" : r.status === "draft" ? "warning" : "neutral"}>{r.status}</Pill> },
    { id: "submissions", header: "Submissions", sortValue: (r) => r.submissions, accessor: (r) => <span className="text-sm font-medium">{r.submissions.toLocaleString()}</span>, align: "right" },
    { id: "conversion", header: "Conversion", sortValue: (r) => r.conversion, accessor: (r) => <span className="text-sm">{r.conversion}%</span>, align: "right" },
    { id: "spam", header: "Spam protection", accessor: (r) => <Switch checked={r.spamProtected} onCheckedChange={() => {}} label={r.spamProtected ? "reCAPTCHA" : "Off"} /> },
    { id: "captured", header: "Captured", accessor: (r) => <span className="text-sm text-muted-foreground">{r.captured}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {groups.map((g, i) => {
          const count = forms.filter((f) => f.type === g.type).length;
          const total = forms.filter((f) => f.type === g.type).reduce((a, b) => a + b.submissions, 0);
          return (
            <div key={g.title} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                <g.icon className="size-3.5" /> {g.title}
              </div>
              <div className="mt-2 text-2xl font-semibold">{count}</div>
              <div className="text-xs text-muted-foreground">{total.toLocaleString()} submissions</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Shield className="size-4 text-primary" /> Spam protection</div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-sm">reCAPTCHA v3</span><Switch checked onCheckedChange={() => {}} /></div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-sm">Honeypot trap</span><Switch checked onCheckedChange={() => {}} /></div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-sm">Rate limit</span><Switch checked onCheckedChange={() => {}} /></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Mail className="size-4 text-primary" /> SMTP routing</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="rounded-xl border border-border p-3 bg-muted/20"><div className="text-xs text-muted-foreground">Provider</div><div className="font-medium">SendGrid</div></div>
            <div className="rounded-xl border border-border p-3 bg-muted/20"><div className="text-xs text-muted-foreground">From</div><div className="font-medium">forms@Organic Leads.io</div></div>
            <div className="rounded-xl border border-border p-3 bg-muted/20"><div className="text-xs text-muted-foreground">Daily quota</div><div className="font-medium">10,000 / 25,000</div></div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Webhook className="size-4 text-primary" /> Webhooks</div>
          <div className="mt-4 space-y-2 text-sm">
            {[
              { l: "HubSpot CRM", u: "https://api.hubapi.com/forms/v2/…" },
              { l: "Slack #leads", u: "https://hooks.slack.com/services/…" },
              { l: "Zapier bridge", u: "https://hooks.zapier.com/…" },
            ].map((w) => (
              <div key={w.l} className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-xs text-muted-foreground">{w.l}</div>
                <div className="font-medium truncate">{w.u}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">All forms</div>
        <Button className="rounded-xl gradient-primary text-white border-0"><Plus className="size-4" /> New form</Button>
      </div>
      <EnterpriseTable
        data={forms}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={[(r) => r.name, (r) => r.type]}
        searchPlaceholder="Search forms by name, type…"
      />
    </div>
  );
}
