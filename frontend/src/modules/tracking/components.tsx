import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, Bot, CheckCircle2, CircleAlert, Download, FileSpreadsheet, Filter, MoreHorizontal, Plus, Search, ShieldCheck, Sparkles, Clock, AlertTriangle, XCircle, CheckCircle, RefreshCw, Eye, Edit, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { trackingApi } from "./services";
import type { TrackingConfig, TrackingIntegration, TrackingEvent, MeasurementPlan, ContactForm, FormSubmission, TrackingVerification, ConsentLog, DeliveryLog, RetryLog, ApprovalRequest, TrackingDashboardStats } from "./types";

const nav = [
  ["Dashboard", "/tracking"], ["Measurement Plan", "/tracking/measurement-plan"], ["Tracking Providers", "/tracking/providers"], ["Tracking Verification", "/tracking/verification"], ["Consent Management", "/tracking/consent"], ["Contact Forms", "/tracking/contact-forms"], ["Form Builder", "/tracking/form-builder"], ["Submissions", "/tracking/submissions"], ["Spam Protection", "/tracking/spam-protection"], ["Delivery Logs", "/tracking/delivery-logs"], ["Retry Logs", "/tracking/retry-logs"], ["Audit Logs", "/tracking/audit-logs"], ["Approval Center", "/tracking/approvals"], ["Settings", "/tracking/settings"],
] as const;

export function TrackingNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-2">
      <nav role="tablist" aria-label="Tracking & Forms" className="flex flex-wrap items-center gap-1.5">
        {nav.map(([name, to]) => (
          <Link key={to} to={to} role="tab" aria-selected={path === to} className={`inline-flex h-10 items-center rounded-xl border px-3.5 text-sm font-medium whitespace-nowrap transition ${path === to ? "border-transparent bg-gradient-to-r from-primary/12 to-accent/8 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]" : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/40 hover:text-foreground"}`}>{name}</Link>
        ))}
      </nav>
    </div>
  );
}

export function TrackingStats({ stats }: { stats: TrackingDashboardStats }) {
  const cards = [
    ["Tracking Health", `${stats.trackingHealth}%`, Activity],
    ["Connected Platforms", "9", CheckCircle2],
    ["Conversions Today", "186", Sparkles],
    ["Forms Submitted", "74", Bot],
    ["Consent Rate", "96.8%", ShieldCheck],
    ["Failed Events", "3", CircleAlert],
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {cards.map(([l, v, I]) => {
        const Icon = I as typeof Activity;
        return (
          <Card key={l as string} className="p-4">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              {l as string}
              <Icon className="size-3.5 text-primary" />
            </div>
            <div className="text-2xl font-semibold mt-2">{v as string}</div>
          </Card>
        );
      })}
    </div>
  );
}

export function TrackingDashboard() {
  const [stats, setStats] = useState<TrackingDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackingApi.dashboard.getStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <TrackingStats stats={stats || { trackingHealth: 94, verificationStatus: "verified", submissionCount: 186, conversionRate: 0, spamDetection: 0, consentRate: 96.8, failedDeliveries: 3, retryCount: 0, pendingApprovals: 0, eventSummary: {} }} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Recent Submissions
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="text-sm font-medium">Demo request form</div>
              <Badge variant="secondary">Delivered</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="text-sm font-medium">Newsletter signup</div>
              <Badge variant="secondary">Pending</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="text-sm font-medium">Trial started</div>
              <Badge variant="destructive">Failed</Badge>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Tracking Providers
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="text-sm font-medium">Google Analytics 4</div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="text-sm font-medium">Meta Pixel</div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div className="text-sm font-medium">Google Tag Manager</div>
              <Badge variant="secondary">Connected</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function TrackingTable({ title, description, records, columns }: { title: string; description: string; records: any[]; columns: { key: string; label: string; render?: (v: any) => React.ReactNode }[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => records.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(query.toLowerCase()))), [records, query]);

  return (
    <Card className="p-5 mb-5">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((c) => (
                <th key={c.key} className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((record, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition">
                {columns.map((c) => (
                  <td key={c.key} className="py-3 px-3">{c.render ? c.render(record[c.key]) : String(record[c.key] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function StatusIndicator({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    connected: "bg-success/10 text-success border-success/20",
    verified: "bg-success/10 text-success border-success/20",
    healthy: "bg-success/10 text-success border-success/20",
    delivered: "bg-success/10 text-success border-success/20",
    pending: "bg-warning/10 text-warning-foreground border-warning/30",
    inactive: "bg-muted text-muted-foreground border-border",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
    unhealthy: "bg-destructive/10 text-destructive border-destructive/20",
    draft: "bg-muted text-muted-foreground border-border",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
    retrying: "bg-warning/10 text-warning-foreground border-warning/30",
    sent: "bg-info/10 text-info border-info/20",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${colors[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}

export function TrackingPage() {
  return (
    <div>
      <TrackingNav />
      <TrackingDashboard />
    </div>
  );
}