import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Layers,
  Power,
  FileText,
  Copy,
  Search,
  RefreshCw,
  Download,
  Eye,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EnterpriseTable,
  type Column,
} from "@/modules/website-foundation/components/enterprise-table";
import { formService } from "@/modules/website-foundation/services";
import type { FormManagerForm, FormLog } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { toast } from "sonner";
import { StatCard } from "@/modules/website-foundation/components/stat-cards";

import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";

export const Route = createFileRoute("/_app/website-foundation/forms")({
  head: () => ({ meta: [{ title: "Forms | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Forms">
      <FormManager />
    </ErrorBoundary>
  ),
});

function FormManager() {
  const [websiteId, setWebsiteId] = useState<string>("");
  const [forms, setForms] = useState<FormManagerForm[]>([]);
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "broken" | "healthy">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FormManagerForm | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await import("@/api/websiteApi").then((m) => m.websiteApi.list());
        if (res.items.length > 0) {
          setWebsiteId(res.items[0].id);
        }
      } catch {
        toast.error("No websites registered");
      }
    };
    init();
  }, []);

  const loadForms = async () => {
    const rawData = (await formService.list()) as unknown as Record<string, unknown>[];
    const normalized: FormManagerForm[] = (rawData || []).map((f) => ({
      id: String(f.id || f.wordpress_form_id || ""),
      plugin: (f.plugin as string) || "unknown",
      name: (f.name as string) || (f.title as string) || "Untitled",
      description: (f.description as string) || "",
      status: (f.status as FormManagerForm["status"]) || "draft",
      shortcode: (f.shortcode as string) || "",
      fields: (f.fields as FormManagerForm["fields"]) || [],
      fieldsCount: ((f.fields as []) || []).length,
      entriesCount: (f.entriesCount as number) || (f.entries_count as number) || 0,
      health: (f.health as FormManagerForm["health"]) || "unknown",
      responsive: f.responsive === true,
      responsiveStatus: (f.responsiveStatus as FormManagerForm["responsiveStatus"]) || {
        desktop: "pass",
        tablet: "pass",
        mobile: "pass",
      },
      healthChecks:
        (f.healthChecks as Record<string, boolean>) ||
        (f.health_checks as Record<string, boolean>) ||
        {},
      createdAt: (f.createdAt as string) || (f.created_at as string) || "",
      updatedAt: (f.updatedAt as string) || (f.updated_at as string) || "",
    }));
    setForms(normalized);
  };

  useEffect(() => {
    if (websiteId) {
      loadForms();
    }
  }, [websiteId]);

  const filtered = useMemo(() => {
    return forms.filter((f) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "published" && f.status === "published") ||
        (filter === "draft" && f.status === "draft") ||
        (filter === "broken" && f.health === "critical") ||
        (filter === "healthy" && f.health === "healthy");

      const matchesSearch =
        !query ||
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.plugin.toLowerCase().includes(query.toLowerCase()) ||
        (f.shortcode || "").toLowerCase().includes(query.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [forms, filter, query]);

  const columns: Column<FormManagerForm>[] = [
    {
      id: "name",
      header: "Form",
      sortValue: (r) => r.name,
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-muted/40 grid place-items-center text-primary shrink-0">
            <Layers className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{r.name}</div>
            <div className="text-[11px] text-muted-foreground truncate">{r.description}</div>
          </div>
        </div>
      ),
    },
    {
      id: "plugin",
      header: "Plugin",
      sortValue: (r) => r.plugin,
      accessor: (r) => (
        <Badge variant="outline" className="text-xs font-medium">
          {r.plugin}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (r) => r.status,
      accessor: (r) => (
        <Pill
          intent={
            r.status === "published" ? "success" : r.status === "draft" ? "warning" : "neutral"
          }
        >
          {r.status}
        </Pill>
      ),
    },
    {
      id: "shortcode",
      header: "Shortcode",
      accessor: (r) => <code className="text-xs bg-muted/30 px-2 py-1 rounded">{r.shortcode}</code>,
    },
    {
      id: "fields",
      header: "Fields",
      sortValue: (r) => r.fieldsCount,
      accessor: (r) => <span className="text-sm">{r.fieldsCount}</span>,
    },
    {
      id: "health",
      header: "Health",
      accessor: (r) => {
        const intent =
          r.health === "critical"
            ? "danger"
            : r.health === "warning"
              ? "warning"
              : r.health === "healthy"
                ? "success"
                : "neutral";
        return <Pill intent={intent}>{r.health || "unknown"}</Pill>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      accessor: (r) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg h-8"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(r.shortcode || "");
              toast.success("Shortcode copied to clipboard");
            }}
          >
            <Copy className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg h-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(r);
            }}
          >
            <Eye className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-mds gap-3">
        <StatCard
          label="Total forms"
          value={forms.length}
          hint="Installed"
          icon={Layers}
          index={0}
        />
        <StatCard
          label="Published"
          value={forms.filter((f) => f.status === "published").length}
          hint="Currently live"
          icon={Power}
          intent="success"
          index={1}
        />
        <StatCard
          label="Drafts"
          value={forms.filter((f) => f.status === "draft").length}
          hint="Unpublished"
          icon={FileText}
          intent="warning"
          index={2}
        />
        <StatCard
          label="Healthy"
          value={forms.filter((f) => f.health === "healthy").length}
          hint="Passing checks"
          icon={ShieldCheck}
          intent="success"
          index={3}
        />
        <StatCard
          label="Broken"
          value={forms.filter((f) => f.health === "critical").length}
          hint="Need attention"
          icon={Activity}
          intent={forms.filter((f) => f.health === "critical").length > 0 ? "danger" : "success"}
          index={4}
        />
        <StatCard
          label="Recently created"
          value={
            forms.filter((f) => {
              const d = new Date(f.createdAt);
              return !isNaN(d.getTime()) && Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
            }).length
          }
          hint="Last 7 days"
          icon={Layers}
          index={5}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 rounded-xl h-9 w-56"
              placeholder="Search forms…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-xl" onClick={() => loadForms()}>
            <RefreshCw className="size-4 mr-2" />
            Sync Forms
          </Button>
          <Button variant="outline" className="rounded-xl">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="forms" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="forms" className="rounded-lg">
            Forms
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg">
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forms">
          <EnterpriseTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelected(r)}
            searchKeys={[(r) => r.name, (r) => r.plugin, (r) => r.shortcode || ""]}
            searchPlaceholder="Search forms by name, plugin, shortcode…"
            emptyState={
              <div className="text-center py-12 text-muted-foreground">
                <Layers className="size-12 mx-auto mb-3 opacity-50" />
                <p>No forms have been discovered.</p>
                <p className="text-xs mt-1">
                  Click "Sync Forms" to retrieve forms from the connected WordPress site.
                </p>
              </div>
            }
          />
        </TabsContent>

        <TabsContent value="logs">
          <FormLogsTab websiteId={websiteId} />
        </TabsContent>
      </Tabs>

      {selected && <FormDetailSheet form={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FormLogsTab({ websiteId }: { websiteId: string }) {
  const [logs, setLogs] = useState<FormLog[]>([]);

  useEffect(() => {
    if (websiteId) {
      formService
        .getLogs(50)
        .then(setLogs)
        .catch(() => setLogs([]));
    }
  }, [websiteId]);

  const columns: Column<FormLog>[] = [
    {
      id: "form_id",
      header: "Form",
      sortValue: (r) => r.form_id,
      accessor: (r) => <span className="text-sm font-medium">{r.form_id}</span>,
    },
    {
      id: "operation",
      header: "Operation",
      sortValue: (r) => r.operation,
      accessor: (r) => <Pill intent="info">{r.operation}</Pill>,
    },
    {
      id: "status",
      header: "Status",
      accessor: (r) => (
        <Pill intent={r.status === "success" ? "success" : "danger"}>{r.status}</Pill>
      ),
    },
    {
      id: "executed_by",
      header: "Actor",
      accessor: (r) => <span className="text-sm">{r.executed_by || "system"}</span>,
    },
    {
      id: "execution_time_seconds",
      header: "Duration",
      accessor: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.execution_time_seconds ? `${r.execution_time_seconds.toFixed(2)}s` : "—"}
        </span>
      ),
    },
    {
      id: "created_at",
      header: "When",
      sortValue: (r) => r.created_at,
      accessor: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="size-12 mx-auto mb-3 opacity-50" />
        <p>No audit logs available</p>
      </div>
    );
  }

  return (
    <EnterpriseTable
      data={logs}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search logs by form, operation, actor…"
    />
  );
}

function FormDetailSheet({ form, onClose }: { form: FormManagerForm; onClose: () => void }) {
  return (
    <Sheet open={!!form} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {form.name}
            <Badge variant={form.status === "published" ? "default" : "outline"}>
              {form.status}
            </Badge>
          </SheetTitle>
          <SheetDescription>{form.description || "No description available."}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Plugin", value: form.plugin },
              { label: "Status", value: form.status },
              { label: "Shortcode", value: form.shortcode || "N/A" },
              { label: "Fields", value: String(form.fieldsCount) },
              { label: "Entries", value: String(form.entriesCount || 0) },
              { label: "Health", value: form.health || "unknown" },
              { label: "Responsive", value: form.responsive ? "Yes" : "No" },
              { label: "Created", value: form.createdAt || "N/A" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </div>
                <div className="text-sm font-medium mt-1 capitalize">{item.value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Health Checks</div>
            <div className="space-y-1">
              {Object.entries(form.healthChecks || {}).map(([check, passed]) => (
                <div key={check} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{check.replace(/_/g, " ")}</span>
                  <Pill intent={passed ? "success" : "danger"}>{passed ? "Pass" : "Fail"}</Pill>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Fields ({form.fieldsCount})</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {(form.fields || []).map((field, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{field.label || field.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => {
              navigator.clipboard.writeText(form.shortcode || "");
              toast.success("Shortcode copied to clipboard");
            }}
          >
            <FileText className="size-4 mr-2" />
            Copy shortcode
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
