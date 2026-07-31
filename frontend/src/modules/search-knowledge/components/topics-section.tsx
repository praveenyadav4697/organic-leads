import { Skeleton } from "@/components/ui/skeleton";
import type { Topic, PaginatedTopics } from "@/modules/search-knowledge/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HEALTH_COLORS } from "@/modules/search-knowledge/constants";

interface TopicsSectionProps {
  data: PaginatedTopics | undefined;
  isLoading: boolean;
}

export function TopicsSection({ data, isLoading }: TopicsSectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const topics = data?.items ?? [];

  if (topics.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No topics found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {topics.map((topic) => (
        <Card key={topic.id} className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold">{topic.name}</h3>
              <p className="text-xs text-muted-foreground">Rank #{topic.ranking}</p>
            </div>
            <Badge variant="outline" className={HEALTH_COLORS[topic.health].bg}>{topic.health}</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Coverage</span>
              <span>{topic.coverage}%</span>
            </div>
            <Progress value={topic.coverage} className="h-2" />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{topic.articles} articles</span>
            <Badge variant="secondary" className="rounded-full text-[10px]">{topic.priority}</Badge>
          </div>
          {topic.recommendations.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Recommendations</div>
              {topic.recommendations.slice(0, 2).map((rec, i) => (
                <div key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-primary mt-0.5">•</span> {rec}
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}