import type { GoogleProductConnection } from "@/modules/google-products/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface GoogleProductConnectionCardProps {
  connection: GoogleProductConnection;
  onDelete: (id: string) => void;
}

export function GoogleProductConnectionCard({ connection, onDelete }: GoogleProductConnectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{connection.product_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mt-2">
          <StatusBadge status={connection.health_status === "healthy" ? "active" : "pending"} />
          <Button variant="outline" size="sm">Manage</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(connection.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}