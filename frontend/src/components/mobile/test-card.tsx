import type { MobileTest } from "@/modules/mobile/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface MobileTestCardProps {
  test: MobileTest;
  onDelete: (id: string) => void;
}

export function MobileTestCard({ test, onDelete }: MobileTestCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm truncate">{test.url}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mt-2">
          <StatusBadge status="active" />
          <Button variant="outline" size="sm">Results</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(test.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}