import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { ContentGap } from "@/modules/search-knowledge/types";
import { STATUS_COLORS, PRIORITY_ORDER } from "@/modules/search-knowledge/constants";
import { ArrowUpRight } from "lucide-react";

interface ContentGapsSectionProps {
  data: ContentGap[] | undefined;
  isLoading: boolean;
}

export function ContentGapsSection({ data, isLoading }: ContentGapsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  const gaps = [...(data ?? [])].sort(
    (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority]
  );

  if (gaps.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No content gaps found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {gaps.map((gap) => (
        <Card key={gap.id} className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={STATUS_COLORS[gap.priority]}>{gap.priority}</Badge>
                <span className="text-xs font-medium">{gap.keyword}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Topic: {gap.topic}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Opportunity</span>
                  <span>{gap.opportunityScore}/100</span>
                </div>
                <Progress value={gap.opportunityScore} className="h-1.5" />
              </div>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <div className="text-[11px] text-muted-foreground">Ranking</div>
              <div className="text-sm font-semibold">#{gap.currentRanking}</div>
              <Button variant="outline" size="sm" className="mt-2 rounded-xl h-7 text-[11px]">
                Target <ArrowUpRight className="size-3 ml-1" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}