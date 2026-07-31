import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, XCircle, Shield } from "lucide-react";
import type { DiagnosticPlugin } from "@/types/website";

function PluginHealthBadge({ health }: { health: string }) {
  const variant = health === "critical" ? "destructive" : health === "warn" ? "secondary" : "default";
  return <Badge variant={variant}>{health}</Badge>;
}

interface PluginInventoryProps {
  plugins: DiagnosticPlugin[];
  isLoading: boolean;
}

export function PluginInventory({ plugins, isLoading }: PluginInventoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Plugin Inventory</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (plugins.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Plugin Inventory</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No plugins detected. Run a diagnostics scan to discover WordPress plugins.</p>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = plugins.filter((p) => p.health === "critical").length;
  const warnCount = plugins.filter((p) => p.health === "warn").length;
  const goodCount = plugins.filter((p) => p.health === "good").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Plugin Inventory</CardTitle>
          <CardDescription>
            {plugins.length} plugins found &middot; {criticalCount} critical &middot; {warnCount} warnings &middot; {goodCount} healthy
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && <Badge variant="destructive">{criticalCount} Critical</Badge>}
          {warnCount > 0 && <Badge variant="secondary">{warnCount} Warnings</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plugin</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plugins.map((plugin) => (
                <TableRow key={plugin.plugin_key}>
                  <TableCell className="font-medium">{plugin.name}</TableCell>
                  <TableCell>{plugin.version || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={plugin.status === "active" ? "default" : "outline"} className="capitalize">{plugin.status}</Badge>
                  </TableCell>
                  <TableCell><PluginHealthBadge health={plugin.health} /></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {plugin.deprecated && <AlertTriangle className="size-3 text-yellow-500" title={plugin.deprecation_reason || "Deprecated"} />}
                      {plugin.vulnerabilities && plugin.vulnerabilities.map((v, i) => (
                        <Shield key={i} className="size-3 text-red-500" title={v} />
                      ))}
                      {plugin.update_available && <span className="text-xs text-blue-500">Update available</span>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}