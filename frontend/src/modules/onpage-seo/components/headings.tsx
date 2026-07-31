import type { SEHeading } from "@/modules/onpage-seo/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-react";
import { STATUS_COLORS } from "@/modules/onpage-seo/constants";

interface HeadingsTabProps {
  headings: SEHeading[];
  isLoading: boolean;
}

export function HeadingsTab({ headings, isLoading }: HeadingsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-32 mb-2" />
            <div className="skeleton h-3 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (headings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Hash className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No heading data available.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {headings.map((h) => (
        <Card key={h.id} className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-primary" />
              <span className="text-sm font-medium">H{h.level}</span>
            </div>
            <Badge variant="outline" className={h.is_duplicate ? STATUS_COLORS.warning : STATUS_COLORS.passed}>
              {h.is_duplicate ? "Duplicate" : "OK"}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{h.text}</div>
        </Card>
      ))}
    </div>
  );
}