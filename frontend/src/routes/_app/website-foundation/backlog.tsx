import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ListChecks, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnterpriseTable, type Column } from "@/modules/website-foundation/components/enterprise-table";
import { backlogService } from "@/modules/website-foundation/services";
import type { BacklogIssue } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { AISection } from "@/modules/website-foundation/components/ai-section";

export const Route = createFileRoute("/_app/website-foundation/backlog")({
  head: () => ({ meta: [{ title: "Issue Backlog | Organic Leads" }] }),
  component: IssueBacklog,
});

function IssueBacklog() {
  const [issues, setIssues] = useState<BacklogIssue[]>([]);
  useEffect(() => { backlogService.list().then(setIssues); }, []);

  const columns: Column<BacklogIssue>[] = [
    { id: "issue", header: "Issue", sortValue: (r) => r.issue, accessor: (r) => (
      <div className="max-w-md">
        <div className="text-sm font-medium">{r.issue}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{r.aiRecommendation}</div>
      </div>
    ) },
    { id: "severity", header: "Severity", sortValue: (r) => r.severity, accessor: (r) => (
      <Pill intent={r.severity === "critical" ? "danger" : r.severity === "high" ? "warning" : r.severity === "medium" ? "info" : "neutral"}>{r.severity}</Pill>
    ) },
    { id: "category", header: "Category", sortValue: (r) => r.category, accessor: (r) => <span className="text-sm">{r.category}</span> },
    { id: "priority", header: "Priority", sortValue: (r) => r.priority, accessor: (r) => <Pill intent="primary">{r.priority.toUpperCase()}</Pill> },
    { id: "detected", header: "Detected", sortValue: (r) => r.detected, accessor: (r) => <span className="text-sm text-muted-foreground">{r.detected}</span> },
    { id: "assignedTo", header: "Assigned", sortValue: (r) => r.assignedTo, accessor: (r) => <span className="text-sm">{r.assignedTo}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => (
      <Pill intent={r.status === "resolved" ? "success" : r.status === "in_progress" ? "info" : r.status === "deferred" ? "warning" : "neutral"}>{r.status.replace("_", " ")}</Pill>
    ) },
    { id: "dueDate", header: "Due", sortValue: (r) => r.dueDate, accessor: (r) => <span className="text-sm text-muted-foreground">{r.dueDate}</span> },
    { id: "ai", header: "AI", accessor: (r) => (
      <div className="flex items-center gap-1 text-xs text-primary">
        <Sparkles className="size-3.5" />
        <span className="truncate max-w-[140px]">{r.aiRecommendation === "—" ? "—" : "Suggest"}</span>
      </div>
    ) },
  ];

  const open = issues.filter((i) => i.status === "open").length;
  const inProgress = issues.filter((i) => i.status === "in_progress").length;
  const critical = issues.filter((i) => i.severity === "critical").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Open", v: open, icon: AlertTriangle, intent: "warning" as const },
          { l: "In progress", v: inProgress, icon: ListChecks, intent: "info" as const },
          { l: "Critical", v: critical, icon: AlertTriangle, intent: "danger" as const },
          { l: "AI suggestions", v: issues.filter((i) => i.aiRecommendation !== "—").length, icon: Sparkles, intent: "primary" as const },
        ].map((s, i) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <s.icon className="size-3.5" /> {s.l}
            </div>
            <div className="mt-2 text-2xl font-semibold">{s.v}</div>
          </div>
        ))}
      </div>

      <EnterpriseTable
        data={issues}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={[(r) => r.issue, (r) => r.category, (r) => r.assignedTo]}
        searchPlaceholder="Search issues by title, category, owner…"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AISection title="AI issue explanations" kind="issue" />
        <AISection title="AI fix recommendations" kind="fix" />
      </div>
    </div>
  );
}
