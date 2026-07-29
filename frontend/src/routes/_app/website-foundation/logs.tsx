import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Search, Download, Shield, Activity, Cpu, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnterpriseTable, type Column } from "@/modules/website-foundation/components/enterprise-table";
import { logService } from "@/modules/website-foundation/services";
import type { LogEntry } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";

export const Route = createFileRoute("/_app/website-foundation/logs")({
  head: () => ({ meta: [{ title: "Logs — Nebula" }] }),
  component: LogsCenter,
});

const typeIcon = {
  audit: Shield,
  system: Cpu,
  error: AlertOctagon,
  activity: Activity,
} as const;

function LogsCenter() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "audit" | "system" | "error" | "activity">("all");
  const [query, setQuery] = useState("");

  useEffect(() => { logService.list().then(setLogs); }, []);

  const filtered = logs.filter((l) => (filter === "all" || l.type === filter) && (!query || l.message.toLowerCase().includes(query.toLowerCase())));

  const columns: Column<LogEntry>[] = [
    { id: "type", header: "Type", sortValue: (r) => r.type, accessor: (r) => {
      const Icon = typeIcon[r.type];
      return (
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span className="text-sm capitalize">{r.type}</span>
        </div>
      );
    } },
    { id: "message", header: "Message", sortValue: (r) => r.message, accessor: (r) => <span className="text-sm font-medium">{r.message}</span> },
    { id: "level", header: "Level", sortValue: (r) => r.level, accessor: (r) => (
      <Pill intent={r.level === "critical" || r.level === "high" ? "danger" : r.level === "medium" ? "warning" : "info"}>{r.level}</Pill>
    ) },
    { id: "actor", header: "Actor", accessor: (r) => <span className="text-sm">{r.actor}</span> },
    { id: "timestamp", header: "Timestamp", sortValue: (r) => r.timestamp, accessor: (r) => <span className="text-sm text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</span> },
    { id: "correlationId", header: "Correlation ID", accessor: (r) => <span className="text-xs font-mono text-muted-foreground">{r.correlationId}</span> },
    { id: "traceId", header: "Trace ID", accessor: (r) => <span className="text-xs font-mono text-muted-foreground">{r.traceId}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["audit", "system", "error", "activity"] as const).map((t) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              {(() => { const Icon = typeIcon[t]; return <Icon className="size-3.5" />; })()}
              {t}
            </div>
            <div className="mt-2 text-2xl font-semibold">{logs.filter((l) => l.type === t).length}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "audit", "system", "error", "activity"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={
              "px-3 h-9 rounded-xl text-xs font-medium capitalize border " + (filter === f ? "bg-primary text-white border-primary" : "border-border hover:bg-muted/40")
            }>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 rounded-xl h-9" placeholder="Search logs" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button variant="outline" className="rounded-xl"><Download className="size-4" /> Export</Button>
          <Button className="rounded-xl gradient-primary text-white border-0"><FileText className="size-4" /> Live tail</Button>
        </div>
      </div>

      <EnterpriseTable
        data={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={[(r) => r.message, (r) => r.actor, (r) => r.correlationId, (r) => r.traceId]}
        searchPlaceholder="Search logs by message, actor, correlation id…"
      />
    </div>
  );
}
