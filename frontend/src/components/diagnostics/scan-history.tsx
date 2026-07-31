import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import type { ScanHistoryEntry } from "@/types/website";

interface ScanHistoryProps {
  history: ScanHistoryEntry[];
  isLoading: boolean;
  total: number;
}

function ScanStatusBadge({ status }: { status: string }) {
  const variant = status === "completed" ? "default" : status === "failed" ? "destructive" : status === "running" ? "secondary" : "outline";
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}

export function ScanHistory({ history, isLoading, total }: ScanHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Scan History</CardTitle></CardHeader>
        <CardContent><div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div></CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Scan History</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No scan history available. Run a diagnostics scan to see results.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>{total} scans recorded</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Plugins</TableHead>
                <TableHead>Themes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell className="capitalize">{scan.scan_type}</TableCell>
                  <TableCell><ScanStatusBadge status={scan.status} /></TableCell>
                  <TableCell className="text-sm">{new Date(scan.started_at).toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{scan.completed_at ? new Date(scan.completed_at).toLocaleString() : "—"}</TableCell>
                  <TableCell className="text-sm">{scan.duration_seconds !== null ? `${scan.duration_seconds.toFixed(1)}s` : "—"}</TableCell>
                  <TableCell className="text-sm">{scan.result?.plugins_found ?? "—"}</TableCell>
                  <TableCell className="text-sm">{scan.result?.themes_found ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}