import type { PerformanceCheck } from "@/modules/performance/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface PerformanceCheckCardProps {
  check: PerformanceCheck;
  onDelete: (id: string) => void;
}

export function PerformanceCheckCard({ check, onDelete }: PerformanceCheckCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm truncate">{check.url}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mt-2">
          <StatusBadge status="active" />
          <Button variant="outline" size="sm">Details</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(check.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}