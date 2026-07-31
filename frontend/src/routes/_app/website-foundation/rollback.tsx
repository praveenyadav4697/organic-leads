import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History, RotateCcw, Save, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnterpriseTable, type Column } from "@/modules/website-foundation/components/enterprise-table";
import { rollbackService } from "@/modules/website-foundation/services";
import type { RollbackEntry } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/website-foundation/rollback")({
  head: () => ({ meta: [{ title: "Rollback | Organic Leads" }] }),
  component: RollbackCenter,
});

function RollbackCenter() {
  const [entries, setEntries] = useState<RollbackEntry[]>([]);
  useEffect(() => { rollbackService.list().then(setEntries); }, []);

  const columns: Column<RollbackEntry>[] = [
    { id: "type", header: "Type", sortValue: (r) => r.type, accessor: (r) => <Pill intent="primary">{r.type}</Pill> },
    { id: "version", header: "Version", sortValue: (r) => r.version, accessor: (r) => <span className="text-sm font-medium">{r.version}</span> },
    { id: "environment", header: "Environment", sortValue: (r) => r.environment, accessor: (r) => <Pill intent={r.environment === "production" ? "danger" : r.environment === "staging" ? "warning" : "info"}>{r.environment}</Pill> },
    { id: "changedBy", header: "Changed by", sortValue: (r) => r.changedBy, accessor: (r) => <span className="text-sm">{r.changedBy}</span> },
    { id: "changedAt", header: "When", sortValue: (r) => r.changedAt, accessor: (r) => <span className="text-sm text-muted-foreground">{new Date(r.changedAt).toLocaleString()}</span> },
    { id: "reason", header: "Reason", sortValue: (r) => r.reason, accessor: (r) => <span className="text-sm text-muted-foreground">{r.reason}</span> },
    { id: "snapshot", header: "Snapshot", sortValue: (r) => r.snapshot, accessor: (r) => <span className="text-xs font-mono text-muted-foreground">{r.snapshot}</span> },
    { id: "actions", header: "Actions", align: "right", accessor: (r) => (
      <div className="flex items-center justify-end gap-1">
        <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => toast.success(`${r.type} restored: ${r.version}`)}><RotateCcw className="size-3.5" /> Rollback</Button>
        <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => toast.success(`Restore to ${r.snapshot}`)}><Save className="size-3.5" /> Restore</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { l: "Snapshots", v: entries.length, icon: Save, intent: "primary" as const },
          { l: "Production", v: entries.filter((e) => e.environment === "production").length, icon: Server, intent: "danger" as const },
          { l: "Staging", v: entries.filter((e) => e.environment === "staging").length, icon: Server, intent: "warning" as const },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <s.icon className="size-3.5" /> {s.l}
            </div>
            <div className="mt-2 text-2xl font-semibold">{s.v}</div>
          </div>
        ))}
      </div>

      <EnterpriseTable
        data={entries}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={[(r) => r.version, (r) => r.changedBy, (r) => r.reason, (r) => r.snapshot]}
        searchPlaceholder="Search by version, snapshot, author…"
      />
    </div>
  );
}
