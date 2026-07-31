import type { AuditRun } from "@/modules/audit/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface AuditRunCardProps {
  run: AuditRun;
  onDelete: (id: string) => void;
}

export function AuditRunCard({ run, onDelete }: AuditRunCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{run.audit_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mt-2">
          <StatusBadge status={run.status === "completed" ? "active" : "pending"} />
          <Button variant="outline" size="sm">View</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(run.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}