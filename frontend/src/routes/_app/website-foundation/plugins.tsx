import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Power, Trash2, Upload, Search, Plus, RefreshCw, Download, ChevronRight, Layers, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnterpriseTable, type Column } from "@/modules/website-foundation/components/enterprise-table";
import { pluginService } from "@/modules/website-foundation/services";
import type { Plugin } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { Switch } from "@/modules/website-foundation/components/form-field";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { StatCard } from "@/modules/website-foundation/components/stat-cards";

export const Route = createFileRoute("/_app/website-foundation/plugins")({
  head: () => ({ meta: [{ title: "Plugins | Organic Leads" }] }),
  component: PluginManager,
});

function PluginManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [selected, setSelected] = useState<Plugin | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => { pluginService.list().then(setPlugins); }, []);

  const filtered = useMemo(() => {
    return plugins.filter((p) =>
      (filter === "all" || p.status === filter) &&
      (!query || p.name.toLowerCase().includes(query.toLowerCase()))
    );
  }, [plugins, filter, query]);

  const enabled = plugins.filter((p) => p.status === "enabled").length;
  const needUpdate = plugins.filter((p) => p.health === "warn").length;

  const columns: Column<Plugin>[] = [
    { id: "name", header: "Plugin", sortValue: (r) => r.name, accessor: (r) => (
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-muted/40 grid place-items-center text-primary shrink-0">
          <Layers className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{r.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{r.description}</div>
        </div>
      </div>
    ) },
    { id: "version", header: "Version", sortValue: (r) => r.version, accessor: (r) => <span className="text-sm">{r.version}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <Pill intent={r.status === "enabled" ? "success" : "neutral"}>{r.status}</Pill> },
    { id: "auto", header: "Auto update", accessor: (r) => <Switch checked={r.autoUpdate} onCheckedChange={() => {}} /> },
    { id: "license", header: "License", sortValue: (r) => r.license, accessor: (r) => <span className="text-sm text-muted-foreground">{r.license}</span> },
    { id: "updated", header: "Last updated", sortValue: (r) => r.lastUpdated, accessor: (r) => <span className="text-sm text-muted-foreground">{r.lastUpdated}</span> },
    { id: "actions", header: "Actions", align: "right", accessor: (r) => (
      <div className="flex items-center justify-end gap-1">
        <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={(e) => { e.stopPropagation(); toast.message(`${r.status === "enabled" ? "Disable" : "Enable"} ${r.name}`); }}><Power className="size-3.5" /></Button>
        <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={(e) => { e.stopPropagation(); toast.message(`Update ${r.name}`); }}><RefreshCw className="size-3.5" /></Button>
        <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive" onClick={(e) => { e.stopPropagation(); toast.message(`Delete ${r.name}`); }}><Trash2 className="size-3.5" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total plugins" value={plugins.length} hint="Installed" icon={Layers} index={0} />
        <StatCard label="Active" value={enabled} hint="Currently enabled" icon={Power} intent="success" index={1} />
        <StatCard label="Need attention" value={needUpdate} hint="Updates or warnings" icon={ShieldCheck} intent="warning" index={2} />
        <StatCard label="Auto-update" value={plugins.filter((p) => p.autoUpdate).length} hint="Configured" icon={RefreshCw} intent="primary" index={3} />
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "enabled", "disabled"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={
              "px-3 h-9 rounded-xl text-xs font-medium capitalize border " + (filter === f ? "bg-primary text-white border-primary" : "border-border hover:bg-muted/40")
            }>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 rounded-xl h-9" placeholder="Search plugins" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Button variant="outline" className="rounded-xl"><Download className="size-4" /> Bulk export</Button>
          <Button className="rounded-xl gradient-primary text-white border-0"><Plus className="size-4" /> Install plugin</Button>
        </div>
      </div>

      <EnterpriseTable
        data={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        onRowClick={(r) => setSelected(r)}
        searchKeys={[(r) => r.name, (r) => r.description, (r) => r.license]}
        searchPlaceholder="Search plugins by name, description, license…"
      />

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.name}</SheetTitle>
            <SheetDescription>{selected?.description}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Version", v: selected.version },
                  { l: "License", v: selected.license },
                  { l: "Status", v: selected.status },
                  { l: "Last updated", v: selected.lastUpdated },
                  { l: "Auto-update", v: selected.autoUpdate ? "On" : "Off" },
                  { l: "Health", v: selected.health },
                ].map((c) => (
                  <div key={c.l} className="rounded-xl border border-border p-3 bg-muted/30">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                    <div className="text-sm font-medium mt-1 capitalize">{c.v}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="text-sm font-semibold flex items-center gap-2"><Layers className="size-4 text-primary" /> Dependencies</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.dependencies.length === 0 && <span className="text-xs text-muted-foreground">No dependencies</span>}
                  {selected.dependencies.map((d) => <Pill key={d} intent="info">{d}</Pill>)}
                </div>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <div className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Plugin health</div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm"><span>Compatibility</span><Pill intent="success">OK</Pill></div>
                  <div className="flex items-center justify-between text-sm"><span>Performance impact</span><Pill intent={selected.health === "warn" ? "warning" : "success"}>{selected.health === "warn" ? "Medium" : "Low"}</Pill></div>
                  <div className="flex items-center justify-between text-sm"><span>Security score</span><Pill intent="success">A</Pill></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl">View changelog <ChevronRight className="size-4" /></Button>
                <Button className="rounded-xl gradient-primary text-white border-0">Update plugin</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
