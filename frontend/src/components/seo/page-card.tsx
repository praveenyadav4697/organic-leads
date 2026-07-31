import type { WebPage } from "@/modules/seo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface SeoPageCardProps {
  page: WebPage;
  onDelete: (id: string) => void;
}

export function SeoPageCard({ page, onDelete }: SeoPageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm truncate">{page.url}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mt-2">
          <StatusBadge status="active" />
          <Button variant="outline" size="sm">Edit</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(page.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}