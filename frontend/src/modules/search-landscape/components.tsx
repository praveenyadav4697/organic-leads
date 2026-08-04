import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ExternalLink, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/** F03 tab navigation — exactly the Phase 1 contract tabs. */
const nav = [
  ["Overview", "/search-knowledge"],
  ["SERP Features", "/search-knowledge/serp-features"],
  ["Algorithm Updates", "/search-knowledge/algorithm-updates"],
  ["Search Operators", "/search-knowledge/search-operators"],
  ["Knowledge Base", "/search-knowledge/knowledge-base"],
  ["Documentation", "/search-knowledge/documentation"],
  ["Versions", "/search-knowledge/versions"],
  ["Sync Logs", "/search-knowledge/sync-logs"],
] as const;

export function SearchLandscapeNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-2">
      <nav
        role="tablist"
        aria-label="Search Landscape Knowledge"
        className="flex flex-wrap gap-1.5"
      >
        {nav.map(([name, to]) => (
          <Link
            key={to}
            to={to}
            role="tab"
            aria-selected={path === to}
            className={`inline-flex h-10 items-center rounded-xl border px-3.5 text-sm font-medium whitespace-nowrap transition ${
              path === to
                ? "border-transparent bg-gradient-to-r from-primary/12 to-accent/8 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]"
                : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            {name}
          </Link>
        ))}
      </nav>
    </div>
  );
}

/** Stat tile used on the Overview tab. */
export function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
        {Icon && <Icon className="size-3.5 text-primary" />}
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </Card>
  );
}

/** Colored badge for an approval state (pending / approved / rejected). */
export function ApprovalBadge({ value }: { value: string }) {
  if (value === "approved")
    return (
      <Badge className="border-success/30 bg-success/10 text-success">Approved</Badge>
    );
  if (value === "rejected")
    return (
      <Badge className="border-destructive/30 bg-destructive/10 text-destructive">Rejected</Badge>
    );
  return (
    <Badge className="border-warning/30 bg-warning/10 text-warning-foreground">Pending</Badge>
  );
}

/** Colored badge for an algorithm lifecycle state. */
export function AlgorithmStatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    rolling_out: "border-warning/30 bg-warning/10 text-warning-foreground",
    completed: "border-success/30 bg-success/10 text-success",
    withdrawn: "border-muted bg-muted/40 text-muted-foreground",
    announced: "border-primary/30 bg-primary/10 text-primary",
  };
  const label = value.replace("_", " ");
  return (
    <Badge className={map[value] ?? "border-border bg-muted/40 text-muted-foreground"}>
      {label}
    </Badge>
  );
}

/** Colored badge for a priority level. */
export function PriorityBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    critical: "border-destructive/30 bg-destructive/10 text-destructive",
    high: "border-warning/30 bg-warning/10 text-warning-foreground",
    medium: "border-primary/30 bg-primary/10 text-primary",
    low: "border-muted bg-muted/40 text-muted-foreground",
  };
  return (
    <Badge className={map[value] ?? "border-border bg-muted/40 text-muted-foreground"}>
      {value}
    </Badge>
  );
}

/** Boolean badge (Supported / Not supported). */
export function SupportedBadge({ value }: { value: boolean }) {
  return value ? (
    <Badge className="border-success/30 bg-success/10 text-success">Supported</Badge>
  ) : (
    <Badge variant="outline">Not supported</Badge>
  );
}

/** External documentation link. */
export function DocLink({ url, label }: { url: string | null; label?: string }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
    >
      {label ?? "Documentation"}
      <ExternalLink className="size-3" />
    </a>
  );
}

/** Localized datetime cell. */
export function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span>{value}</span>;
  return <span>{date.toLocaleDateString()}</span>;
}

/** Wrapper for a card-hosted data table. */
export function TableCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Card className="p-5">
      {title && <div className="text-sm font-semibold mb-4">{title}</div>}
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}
