import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, type ChangeEvent } from "react";
import {
  Power,
  Trash2,
  Search,
  Plus,
  RefreshCw,
  Download,
  Layers,
  ShieldCheck,
  Upload,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EnterpriseTable,
  type Column,
} from "@/modules/website-foundation/components/enterprise-table";
import { pluginService } from "@/modules/website-foundation/services";
import type {
  Plugin,
  PluginSecurityIssue,
  PluginLog,
  PluginSearchItem,
} from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { Switch } from "@/modules/website-foundation/components/form-field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { StatCard } from "@/modules/website-foundation/components/stat-cards";
import {
  usePlugins,
  usePluginsHealth,
  useActivatePlugin,
  useDeactivatePlugin,
  useDeletePlugin,
  useUpdatePlugin,
  useSetPluginAutoUpdate,
  useInstallPlugin,
  useUploadPlugin,
  usePluginsSecurity,
  usePluginLogs,
} from "@/hooks/useWebsite";

import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";

export const Route = createFileRoute("/_app/website-foundation/plugins")({
  head: () => ({ meta: [{ title: "Plugins | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Plugins">
      <PluginManager />
    </ErrorBoundary>
  ),
});

function PluginManager() {
  const [websiteId, setWebsiteId] = useState<string>("");
  const [filter, setFilter] = useState<
    | "all"
    | "active"
    | "inactive"
    | "premium"
    | "free"
    | "needs-update"
    | "auto-update"
    | "security-issues"
  >("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Plugin | null>(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PluginSearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

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

  const { data: plugins = [], isLoading, refetch: refetchPlugins } = usePlugins(websiteId);
  const { refetch: refetchHealth } = usePluginsHealth(websiteId);
  const { data: security = [] } = usePluginsSecurity(websiteId);
  const { data: logs = [] } = usePluginLogs(websiteId);
  const activateMutation = useActivatePlugin();
  const deactivateMutation = useDeactivatePlugin();
  const deleteMutation = useDeletePlugin();
  const updateMutation = useUpdatePlugin();
  const autoUpdateMutation = useSetPluginAutoUpdate();
  const installMutation = useInstallPlugin();
  const uploadMutation = useUploadPlugin();

  const securityMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of security) {
      map.set(item.slug, item.security_status);
    }
    return map;
  }, [security]);

  const displayPlugins = useMemo(() => {
    return (plugins || []).map((p) => ({
      ...p,
      security_status: securityMap.get(p.slug) || p.securityStatus,
      vulnerability_count:
        security.find((s: PluginSecurityIssue) => s.slug === p.slug)?.vulnerability_count ??
        p.vulnerabilityCount,
      health: p.health || "ok",
    }));
  }, [plugins, securityMap, security]);

  const filtered = useMemo(() => {
    return displayPlugins.filter((p) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && p.status === "enabled") ||
        (filter === "inactive" && p.status === "disabled") ||
        (filter === "premium" && p.license === "premium") ||
        (filter === "free" && p.license !== "premium") ||
        (filter === "needs-update" && p.updateAvailable) ||
        (filter === "auto-update" && p.autoUpdate) ||
        (filter === "security-issues" &&
          (p.vulnerabilityCount > 0 || p.securityStatus === "critical"));

      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.slug.toLowerCase().includes(query.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(query.toLowerCase()) ||
        (p.author || "").toLowerCase().includes(query.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [displayPlugins, filter, query]);

  const enabled = displayPlugins.filter((p) => p.status === "enabled").length;
  const inactive = displayPlugins.length - enabled;
  const needUpdate = displayPlugins.filter((p) => p.updateAvailable).length;
  const autoUpdateCount = displayPlugins.filter((p) => p.autoUpdate).length;
  const securityIssues = displayPlugins.filter((p) => p.vulnerabilityCount > 0).length;

  const handleActivate = async (plugin: Plugin) => {
    if (plugin.status === "enabled") {
      await deactivateMutation.mutateAsync({ websiteId, slug: plugin.slug });
    } else {
      await activateMutation.mutateAsync({ websiteId, slug: plugin.slug });
    }
    refetchPlugins();
    refetchHealth();
  };

  const handleDelete = async (plugin: Plugin) => {
    await deleteMutation.mutateAsync({ websiteId, slug: plugin.slug });
    refetchPlugins();
    refetchHealth();
  };

  const handleUpdate = async (plugin: Plugin) => {
    await updateMutation.mutateAsync({ websiteId, slug: plugin.slug });
    refetchPlugins();
  };

  const handleAutoUpdate = async (plugin: Plugin, enabled: boolean) => {
    await autoUpdateMutation.mutateAsync({ websiteId, slug: plugin.slug, enabled });
    refetchPlugins();
  };

  const handleInstallFromRepo = async (slug: string) => {
    await installMutation.mutateAsync({ websiteId, slug });
    refetchPlugins();
    refetchHealth();
    setInstallDialogOpen(false);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    if (!uploadFile.name.toLowerCase().endsWith(".zip")) {
      toast.error("Invalid file type. Only .zip files are accepted.");
      return;
    }
    const formData = new FormData();
    formData.append("plugin_file", uploadFile, uploadFile.name);
    await uploadMutation.mutateAsync({ websiteId, formData });
    refetchPlugins();
    refetchHealth();
    setUploadDialogOpen(false);
    setUploadFile(null);
  };

  const handleSearchRepo = async (q: string) => {
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const result = await pluginService.search(q, 10, 1);
      setSearchResults(result.plugins || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const columns: Column<Plugin>[] = [
    {
      id: "name",
      header: "Plugin",
      sortValue: (r) => r.name,
      accessor: (r) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-muted/40 grid place-items-center text-primary shrink-0">
            <Layers className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{r.name}</div>
            <div className="text-[11px] text-muted-foreground truncate max-w-xs">
              {r.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortValue: (r) => r.status,
      accessor: (r) => (
        <Pill intent={r.status === "enabled" ? "success" : "neutral"}>
          {r.status === "enabled" ? "Active" : "Inactive"}
        </Pill>
      ),
    },
    {
      id: "version",
      header: "Version",
      sortValue: (r) => r.version,
      accessor: (r) => (
        <div className="text-sm">
          {r.version}
          {r.updateAvailable && (
            <span className="ml-1 text-xs text-primary">→ {r.latestVersion}</span>
          )}
        </div>
      ),
    },
    {
      id: "auto_update",
      header: "Auto",
      accessor: (r) => (
        <Switch checked={r.autoUpdate} onCheckedChange={(v) => handleAutoUpdate(r, v)} />
      ),
    },
    {
      id: "health",
      header: "Health",
      accessor: (r) => {
        const status = r.securityStatus as string;
        const intent =
          status === "critical" ? "danger" : status === "warning" ? "warning" : "success";
        return <Pill intent={intent}>{status === "ok" ? "OK" : status}</Pill>;
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
              handleActivate(r);
            }}
          >
            <Power
              className={`size-3.5 ${r.status === "enabled" ? "text-green-500" : "text-muted-foreground"}`}
            />
          </Button>
          {r.updateAvailable && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-lg h-8"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdate(r);
              }}
            >
              <Download className="size-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg h-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(r);
            }}
          >
            <Search className="size-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-lg h-8 text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete plugin "{r.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The plugin will be permanently removed from the
                  WordPress site.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={() => handleDelete(r)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  const securityColumns: Column<PluginSecurityIssue>[] = [
    {
      id: "name",
      header: "Plugin",
      accessor: (r) => (
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          <span className="text-sm font-medium">{r.name}</span>
        </div>
      ),
    },
    {
      id: "version",
      header: "Version",
      accessor: (r) => <span className="text-sm">{r.version}</span>,
    },
    {
      id: "security_status",
      header: "Status",
      accessor: (r) => {
        const s = r.security_status;
        const intent = s === "critical" ? "danger" : s === "warning" ? "warning" : "success";
        return <Pill intent={intent}>{s}</Pill>;
      },
    },
    {
      id: "vulnerability_count",
      header: "Vulnerabilities",
      accessor: (r) => (
        <span className="text-sm font-medium text-destructive">{r.vulnerability_count}</span>
      ),
    },
    {
      id: "issues",
      header: "Issues",
      accessor: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.issues.map((issue: string) => (
            <Badge key={issue} variant="destructive" className="text-xs">
              {issue}
            </Badge>
          ))}
        </div>
      ),
    },
  ];

  const logColumns: Column<PluginLog>[] = [
    {
      id: "plugin_slug",
      header: "Plugin",
      sortValue: (r) => r.plugin_slug,
      accessor: (r) => <span className="text-sm font-medium">{r.plugin_slug}</span>,
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-mds gap-3">
        <StatCard
          label="Total plugins"
          value={displayPlugins.length}
          hint="Installed"
          icon={Layers}
          index={0}
        />
        <StatCard
          label="Active"
          value={enabled}
          hint="Currently enabled"
          icon={Power}
          intent="success"
          index={1}
        />
        <StatCard
          label="Inactive"
          value={inactive}
          hint="Currently disabled"
          icon={Layers}
          intent={inactive > 0 ? "warning" : "success"}
          index={2}
        />
        <StatCard
          label="Updates available"
          value={needUpdate}
          hint="Pending updates"
          icon={Download}
          intent={needUpdate > 0 ? "warning" : "success"}
          index={3}
        />
        <StatCard
          label="Auto-update"
          value={autoUpdateCount}
          hint="Enabled"
          icon={RefreshCw}
          intent="primary"
          index={4}
        />
        <StatCard
          label="Security issues"
          value={securityIssues}
          hint="Vulnerable plugins"
          icon={ShieldCheck}
          intent={securityIssues > 0 ? "danger" : "success"}
          index={5}
        />
      </div>

      <Tabs defaultValue="plugins" className="space-y-4">
        <TabsList className="rounded-xl">
          <TabsTrigger value="plugins" className="rounded-lg">
            Plugins
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg">
            Security Report
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg">
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plugins" className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
            <div className="flex items-center gap-2">
              {(
                [
                  "all",
                  "active",
                  "inactive",
                  "needs-update",
                  "auto-update",
                  "security-issues",
                ] as const
              ).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    "px-3 h-9 rounded-xl text-xs font-medium capitalize border " +
                    (filter === f
                      ? "bg-primary text-white border-primary"
                      : "border-border hover:bg-muted/40")
                  }
                >
                  {f.replace("-", " ")}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9 rounded-xl h-9 w-56"
                  placeholder="Search plugins…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => refetchPlugins()}
                disabled={isLoading}
              >
                <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="outline" className="rounded-xl">
                <Download className="size-4" />
                Export
              </Button>
              <Button
                className="rounded-xl gradient-primary text-white border-0"
                onClick={() => setUploadDialogOpen(true)}
              >
                <Upload className="size-4" />
                Upload plugin
              </Button>
              <Button
                className="rounded-xl gradient-primary text-white border-0"
                onClick={() => setInstallDialogOpen(true)}
              >
                <Plus className="size-4" />
                Install plugin
              </Button>
            </div>
          </div>

          <EnterpriseTable
            data={filtered}
            columns={columns}
            rowKey={(r) => r.id}
            onRowClick={(r) => setSelected(r)}
            searchKeys={[(r) => r.name, (r) => r.description]}
            searchPlaceholder="Search plugins by name, description…"
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-mds gap-3">
            <StatCard
              label="Total plugins"
              value={displayPlugins.length}
              hint="Installed"
              icon={Layers}
              index={0}
            />
            <StatCard
              label="Active"
              value={enabled}
              hint="Currently enabled"
              icon={Power}
              intent="success"
              index={1}
            />
            <StatCard
              label="Updates available"
              value={needUpdate}
              hint="Pending updates"
              icon={Download}
              intent="warning"
              index={3}
            />
            <StatCard
              label="Security issues"
              value={securityIssues}
              hint="Vulnerable plugins"
              icon={ShieldCheck}
              intent="danger"
              index={5}
            />
          </div>

          {security.length > 0 ? (
            <EnterpriseTable
              data={security}
              columns={securityColumns}
              rowKey={(r) => r.slug}
              searchPlaceholder="Search security issues…"
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="size-12 mx-auto mb-3 opacity-50" />
              <p>No security issues detected</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          {logs.length > 0 ? (
            <EnterpriseTable
              data={logs}
              columns={logColumns}
              rowKey={(r) => r.id}
              searchPlaceholder="Search logs by plugin, operation, actor…"
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="size-12 mx-auto mb-3 opacity-50" />
              <p>No audit logs available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PluginDetailSheet
        plugin={selected}
        onClose={() => setSelected(null)}
        onActivate={handleActivate}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onAutoUpdate={handleAutoUpdate}
      />

      <InstallPluginDialog
        open={installDialogOpen}
        onClose={() => setInstallDialogOpen(false)}
        onInstall={handleInstallFromRepo}
        searchQuery={searchQuery}
        onSearchQuery={setSearchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSearchRepo={handleSearchRepo}
      />

      <UploadPluginDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}

function PluginDetailSheet({
  plugin,
  onClose,
  onActivate,
  onDelete,
  onUpdate,
  onAutoUpdate,
}: {
  plugin: Plugin | null;
  onClose: () => void;
  onActivate: (plugin: Plugin) => void;
  onDelete: (plugin: Plugin) => void;
  onUpdate: (plugin: Plugin) => void;
  onAutoUpdate: (plugin: Plugin, enabled: boolean) => void;
}) {
  if (!plugin) return null;

  const isActive = plugin.status === "enabled";

  return (
    <Sheet open={!!plugin} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {plugin.name}
            {plugin.updateAvailable && (
              <Badge variant="outline" className="text-xs">
                v{plugin.latestVersion} available
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription className="max-w-sm">
            {plugin.description || "No description available."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Version", value: plugin.version },
              { label: "Latest", value: plugin.latestVersion || plugin.version },
              { label: "Status", value: plugin.status },
              { label: "License", value: plugin.license || "N/A" },
              { label: "Author", value: plugin.author || "Unknown" },
              { label: "Last updated", value: plugin.lastUpdated || "N/A" },
              { label: "Requires WP", value: plugin.requiresWp || "N/A" },
              { label: "Requires PHP", value: plugin.requiresPhp || "N/A" },
              { label: "Auto-update", value: plugin.autoUpdate ? "Enabled" : "Disabled" },
              { label: "Security", value: plugin.securityStatus || "unknown" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </div>
                <div className="text-sm font-medium mt-1 capitalize">{item.value}</div>
              </div>
            ))}
          </div>

          {plugin.updateAvailable && (
            <div className="rounded-xl border border-border p-4 bg-warning/5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Download className="size-4 text-warning" />A new version ({plugin.latestVersion})
                is available
              </div>
            </div>
          )}

          {plugin.dependencies && plugin.dependencies.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-2">Dependencies</div>
              <div className="flex flex-wrap gap-2">
                {plugin.dependencies.map((d) => (
                  <Pill key={d} intent="info" className="text-xs">
                    {d}
                  </Pill>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button
            variant={isActive ? "outline" : "default"}
            className="flex-1 rounded-xl"
            onClick={() => onActivate(plugin)}
          >
            <Power className="size-4 mr-2" />
            {isActive ? "Deactivate" : "Activate"}
          </Button>
          {plugin.updateAvailable && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onUpdate(plugin)}
            >
              <Download className="size-4 mr-2" />
              Update
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => onAutoUpdate(plugin, !plugin.autoUpdate)}
          >
            <RefreshCw className="size-4 mr-2" />
            Auto: {plugin.autoUpdate ? "Off" : "On"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="rounded-xl">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete plugin "{plugin.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The plugin will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={() => onDelete(plugin)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InstallPluginDialog({
  open,
  onClose,
  onInstall,
  searchQuery,
  onSearchQuery,
  searchResults,
  searchLoading,
  onSearchRepo,
}: {
  open: boolean;
  onClose: () => void;
  onInstall: (slug: string) => void;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  searchResults: PluginSearchItem[];
  searchLoading: boolean;
  onSearchRepo: (q: string) => void;
}) {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    onSearchQuery(q);
    onSearchRepo(q);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Install plugin from repository</DialogTitle>
          <DialogDescription>
            Search WordPress.org for a plugin to install remotely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 rounded-xl"
              placeholder="Search WordPress plugins…"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          {searchLoading && (
            <div className="text-center py-6 text-muted-foreground">Searching…</div>
          )}

          {!searchLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
            <div className="text-center py-6 text-muted-foreground">No plugins found.</div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((p: PluginSearchItem) => (
                <div
                  key={p.slug}
                  className="border border-border rounded-xl p-3 hover:bg-muted/30 transition flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {p.description}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        v{p.version}
                      </Badge>
                      {p.rating > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ★ {p.rating.toFixed(1)} ({p.num_ratings})
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" className="rounded-lg ml-2" onClick={() => onInstall(p.slug)}>
                    Install
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadPluginDialog({
  open,
  onClose,
  onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Invalid file type. Only .zip files are accepted.");
      return;
    }
    onUpload();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload plugin ZIP</DialogTitle>
          <DialogDescription>
            Upload a plugin .zip file to install it on the WordPress site.
          </DialogDescription>
        </DialogHeader>

        <div
          className={
            "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:bg-muted/20 transition " +
            (file ? "border-primary bg-muted/20" : "border-border")
          }
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) setFile(f);
          }}
          onClick={() => document.getElementById("plugin-upload-input")?.click()}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline">{file.name}</Badge>
              <span className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
          ) : (
            <>
              <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drag & drop a .zip file, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Maximum file size: 50MB</p>
            </>
          )}
          <Input
            id="plugin-upload-input"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="rounded-xl gradient-primary text-white border-0"
            onClick={handleUpload}
            disabled={!file}
          >
            Upload & Install
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
