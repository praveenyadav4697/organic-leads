import type { SEOKeyword } from "@/modules/onpage-seo/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { STATUS_COLORS } from "@/modules/onpage-seo/constants";

interface KeywordsTabProps {
  keywords: SEOKeyword[];
  isLoading: boolean;
}

export function KeywordsTab({ keywords, isLoading }: KeywordsTabProps) {
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

  if (keywords.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Target className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No keyword data available.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {keywords.map((kw) => (
        <Card key={kw.id} className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-primary" />
              <span className="text-sm font-medium">{kw.keyword_text}</span>
            </div>
            <Badge variant="outline" className={STATUS_COLORS[kw.status] ?? ""}>{kw.status}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
            <div>Type: <span className="font-medium">{kw.type}</span></div>
            <div>Density: <span className="font-medium">{kw.density ?? "—"}%</span></div>
            <div>Occurrences: <span className="font-medium">{kw.occurrences ?? "—"}</span></div>
          </div>
        </Card>
      ))}
    </div>
  );
}