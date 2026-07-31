import type { SEMetaTag } from "@/modules/onpage-seo/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit3, AlertTriangle, CheckCircle2 } from "lucide-react";
import { STATUS_COLORS } from "@/modules/onpage-seo/constants";

interface MetaTagsTabProps {
  metaTags: SEMetaTag[];
  isLoading: boolean;
}

export function MetaTagsTab({ metaTags, isLoading }: MetaTagsTabProps) {
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

  if (metaTags.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Edit3 className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No meta tag data available.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {metaTags.map((tag) => (
        <Card key={tag.id} className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="size-4 text-primary" />
              <span className="text-sm font-medium">{tag.tag_type}</span>
            </div>
            <Badge variant="outline" className={tag.is_present ? STATUS_COLORS.passed : STATUS_COLORS.failed}>
              {tag.is_present ? "Present" : "Missing"}
            </Badge>
          </div>
          {tag.tag_value && (
            <div className="text-xs text-muted-foreground mt-1 truncate">{tag.tag_value}</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            Length: {tag.length ?? 0} / {tag.max_length}
            {tag.length && tag.length > tag.max_length && (
              <Badge variant="outline" className="ml-2 bg-warning/15 text-warning-foreground">Over limit</Badge>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}