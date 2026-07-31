import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Shield } from "lucide-react";
import type { DiagnosticTheme } from "@/types/website";

function ThemeStatusBadge({ status }: { status: string }) {
  const variant = status === "active" ? "default" : "outline";
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}

function ThemeHealthIndicator({ deprecated }: { deprecated: boolean }) {
  if (!deprecated) return null;
  return <AlertTriangle className="size-3 text-yellow-500" title="Deprecated theme" />;
}

interface ThemeInventoryProps {
  themes: DiagnosticTheme[];
  isLoading: boolean;
}

export function ThemeInventory({ themes, isLoading }: ThemeInventoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Theme Inventory</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        </CardContent>
      </Card>
    );
  }

  if (themes.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Theme Inventory</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No themes detected. Run a diagnostics scan to discover WordPress themes.</p>
        </CardContent>
      </Card>
    );
  }

  const deprecatedCount = themes.filter((t) => t.deprecated).length;
  const activeCount = themes.filter((t) => t.status === "active").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Theme Inventory</CardTitle>
          <CardDescription>
            {themes.length} themes found &middot; {activeCount} active &middot; {deprecatedCount} deprecated
          </CardDescription>
        </div>
        {deprecatedCount > 0 && <Badge variant="secondary">{deprecatedCount} Deprecated</Badge>}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Theme</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Child Theme</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {themes.map((theme) => (
                <TableRow key={theme.stylesheet}>
                  <TableCell className="font-medium">{theme.name}</TableCell>
                  <TableCell>{theme.version || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={theme.status === "active" ? "default" : "outline"} className="capitalize">{theme.status}</Badge>
                  </TableCell>
                  <TableCell>{theme.author || "—"}</TableCell>
                  <TableCell>{theme.is_child_theme ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-center">
                      <ThemeHealthIndicator deprecated={theme.deprecated} />
                      {theme.deprecated && (
                        <span className="text-xs text-yellow-600">{theme.deprecation_reason}</span>
                      )}
                      {theme.security_issues && theme.security_issues.map((issue, i) => (
                        <Shield key={i} className="size-3 text-red-500" title={issue} />
                      ))}
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