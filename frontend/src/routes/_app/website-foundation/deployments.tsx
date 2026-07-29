import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Rocket, GitBranch, Plus, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnterpriseTable, type Column } from "@/modules/website-foundation/components/enterprise-table";
import { deploymentService } from "@/modules/website-foundation/services";
import type { Deployment } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";

export const Route = createFileRoute("/_app/website-foundation/deployments")({
  head: () => ({ meta: [{ title: "Deployments — Nebula" }] }),
  component: Deployments,
});

function Deployments() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  useEffect(() => { deploymentService.list().then(setDeployments); }, []);

  const columns: Column<Deployment>[] = [
    { id: "env", header: "Environment", sortValue: (r) => r.environment, accessor: (r) => <Pill intent={r.environment === "production" ? "danger" : r.environment === "staging" ? "warning" : "info"}>{r.environment}</Pill> },
    { id: "version", header: "Version", sortValue: (r) => r.version, accessor: (r) => <span className="text-sm font-medium">{r.version}</span> },
    { id: "commit", header: "Commit", sortValue: (r) => r.commit, accessor: (r) => <span className="text-xs font-mono text-muted-foreground">{r.commit}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => (
      <Pill intent={r.status === "success" ? "success" : r.status === "running" ? "info" : r.status === "pending" ? "warning" : "danger"}>{r.status}</Pill>
    ) },
    { id: "pipeline", header: "Pipeline", accessor: (r) => <span className="text-sm">{r.pipeline}</span> },
    { id: "when", header: "Deployed", sortValue: (r) => r.deployedAt, accessor: (r) => <span className="text-sm text-muted-foreground">{new Date(r.deployedAt).toLocaleString()}</span> },
    { id: "by", header: "By", accessor: (r) => <span className="text-sm">{r.deployedBy}</span> },
    { id: "notes", header: "Release notes", accessor: (r) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{r.releaseNotes}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {(["production", "staging", "development"] as const).map((env) => (
          <div key={env} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold capitalize flex items-center gap-2"><Server className="size-4 text-primary" /> {env}</div>
              <Pill intent={env === "production" ? "danger" : env === "staging" ? "warning" : "info"}>{env}</Pill>
            </div>
            <div className="mt-3 text-2xl font-semibold">{deployments.filter((d) => d.environment === env).length}</div>
            <div className="text-xs text-muted-foreground">Deployments tracked</div>
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-lg flex-1"><GitBranch className="size-3.5" /> View pipeline</Button>
              <Button size="sm" className="rounded-lg gradient-primary text-white border-0"><Plus className="size-3.5" /> Deploy</Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2"><Rocket className="size-4 text-primary" /> Deployment history</div>
        <Button className="rounded-xl gradient-primary text-white border-0"><Plus className="size-4" /> New deployment</Button>
      </div>

      <EnterpriseTable
        data={deployments}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={[(r) => r.version, (r) => r.commit, (r) => r.deployedBy, (r) => r.releaseNotes]}
        searchPlaceholder="Search by version, commit, author, notes…"
      />
    </div>
  );
}
