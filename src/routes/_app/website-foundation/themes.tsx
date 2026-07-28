import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Trash2, Upload, Search, Power, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnterpriseTable, type Column } from "@/modules/website-foundation/components/enterprise-table";
import { themeService } from "@/modules/website-foundation/services";
import type { Theme } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/website-foundation/themes")({
  head: () => ({ meta: [{ title: "Themes — Nebula" }] }),
  component: ThemeManager,
});

function ThemeManager() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => { themeService.list().then(setThemes); }, []);

  const filtered = themes.filter((t) => filter === "all" || t.status === filter);

  const columns: Column<Theme>[] = [
    { id: "name", header: "Theme", sortValue: (r) => r.name, accessor: (r) => (
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-muted/40 grid place-items-center text-primary shrink-0">
          <span className="text-[11px] font-semibold">{r.name.slice(0, 2).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{r.name}</div>
          <div className="text-[11px] text-muted-foreground truncate">{r.description}</div>
        </div>
      </div>
    ) },
    { id: "version", header: "Version", sortValue: (r) => r.version, accessor: (r) => <span className="text-sm">{r.version}</span> },
    { id: "status", header: "Status", sortValue: (r) => r.status, accessor: (r) => <Pill intent={r.status === "active" ? "success" : "neutral"}>{r.status}</Pill> },
    { id: "author", header: "Author", sortValue: (r) => r.author, accessor: (r) => <span className="text-sm text-muted-foreground">{r.author}</span> },
    { id: "license", header: "License", sortValue: (r) => r.license, accessor: (r) => <span className="text-sm text-muted-foreground">{r.license}</span> },
    { id: "updated", header: "Updated", sortValue: (r) => r.updated, accessor: (r) => <span className="text-sm text-muted-foreground">{r.updated}</span> },
    { id: "actions", header: "Actions", align: "right", accessor: (r) => (
      <div className="flex items-center justify-end gap-1">
        <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => toast.message(`Preview ${r.name}`)}><Eye className="size-3.5" /></Button>
        <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => toast.success(r.status === "active" ? "Already active" : `${r.name} activated`)}><Power className="size-3.5" /></Button>
        <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={() => toast.message(`Updating ${r.name}`)}><RefreshCw className="size-3.5" /></Button>
        <Button size="sm" variant="ghost" className="rounded-lg h-8 text-destructive" onClick={() => toast.message(`Delete ${r.name}`)}><Trash2 className="size-3.5" /></Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={
              "px-3 h-9 rounded-xl text-xs font-medium capitalize border " + (filter === f ? "bg-primary text-white border-primary" : "border-border hover:bg-muted/40")
            }>{f}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 rounded-xl h-9" placeholder="Search themes" />
          </div>
          <Button className="rounded-xl gradient-primary text-white border-0"><Upload className="size-4" /> Upload theme</Button>
          <Button variant="outline" className="rounded-xl"><Download className="size-4" /> Theme history</Button>
        </div>
      </div>

      <EnterpriseTable
        data={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        searchKeys={[(r) => r.name, (r) => r.author, (r) => r.license]}
        searchPlaceholder="Search themes by name, author, license…"
      />
    </div>
  );
}
