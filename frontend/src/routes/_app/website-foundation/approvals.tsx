import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, MessageSquare, Palette, Plug, Rocket, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnterpriseTable, type Column } from "@/modules/website-foundation/components/enterprise-table";
import { approvalService } from "@/modules/website-foundation/services";
import type { Approval } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/website-foundation/approvals")({
  head: () => ({ meta: [{ title: "Approvals | Organic Leads" }] }),
  component: ApprovalCenter,
});

const typeIcons: Record<Approval["type"], React.ComponentType<{ className?: string }>> = {
  theme: Palette,
  plugin: Plug,
  deployment: Rocket,
  release: FileCheck,
};

function ApprovalCenter() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  useEffect(() => { approvalService.list().then(setApprovals); }, []);

  const columns: Column<Approval>[] = [
    { id: "type", header: "Type", sortValue: (r) => r.type, accessor: (r) => {
      const Icon = typeIcons[r.type];
      return (
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span className="text-sm capitalize">{r.type}</span>
        </div>
      );
    } },
    { id: "title", header: "Title", sortValue: (r) => r.title, accessor: (r) => <span className="text-sm font-medium">{r.title}</span> },
    { id: "requestedBy", header: "Requested by", accessor: (r) => <span className="text-sm">{r.requestedBy}</span> },
    { id: "reviewer", header: "Reviewer", accessor: (r) => <span className="text-sm">{r.reviewer}</span> },
    { id: "state", header: "State", sortValue: (r) => r.state, accessor: (r) => (
      <Pill intent={r.state === "approved" ? "success" : r.state === "rejected" ? "danger" : r.state === "pending" ? "warning" : "info"}>{r.state.replace("_", " ")}</Pill>
    ) },
    { id: "comments", header: "Comments", accessor: (r) => (
      <div className="flex items-center gap-1 text-sm text-muted-foreground"><MessageSquare className="size-3.5" /> {r.comments}</div>
    ) },
    { id: "createdAt", header: "Created", sortValue: (r) => r.createdAt, accessor: (r) => <span className="text-sm text-muted-foreground">{r.createdAt}</span> },
    { id: "actions", header: "Actions", align: "right", accessor: (r) => (
      <div className="flex items-center justify-end gap-1">
        <Button size="sm" variant="ghost" className="rounded-lg h-8 text-success" onClick={() => toast.success(`Approved ${r.title}`)}><Check className="size-3.5" /> Approve</Button>
        <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive" onClick={() => toast.message(`Rejected ${r.title}`)}><X className="size-3.5" /> Reject</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Pending", v: approvals.filter((a) => a.state === "pending").length, intent: "warning" as const },
          { l: "Approved", v: approvals.filter((a) => a.state === "approved").length, intent: "success" as const },
          { l: "Rejected", v: approvals.filter((a) => a.state === "rejected").length, intent: "danger" as const },
          { l: "Changes requested", v: approvals.filter((a) => a.state === "changes_requested").length, intent: "info" as const },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
            <div className="mt-2 text-2xl font-semibold">{s.v}</div>
          </div>
        ))}
      </div>

      <EnterpriseTable
        data={approvals}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={[(r) => r.title, (r) => r.requestedBy, (r) => r.reviewer, (r) => r.comments]}
        searchPlaceholder="Search by title, requester, comments…"
      />
    </div>
  );
}
