import type { SearchConsoleProperty } from "@/modules/search-console/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface SearchConsolePropertyCardProps {
  property: SearchConsoleProperty;
  onDelete: (id: string) => void;
}

export function SearchConsolePropertyCard({ property, onDelete }: SearchConsolePropertyCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{property.property_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{property.site_url}</p>
        <StatusBadge status={property.connection_status} />
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm">View</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(property.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}