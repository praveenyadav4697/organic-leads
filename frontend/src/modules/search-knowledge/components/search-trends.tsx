import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { SearchTrend } from "@/modules/search-knowledge/types";
import { KnowledgeGrowthChart } from "@/modules/search-knowledge/components/charts";

interface SearchTrendsSectionProps {
  data: SearchTrend[] | undefined;
  isLoading: boolean;
}

export function SearchTrendsSection({ data, isLoading }: SearchTrendsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const trends = data ?? [];

  if (trends.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No trend data available.</p>
      </div>
    );
  }

  const topTrending = trends
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="text-sm font-semibold mb-3">Keyword Growth</div>
        <KnowledgeGrowthChart data={trends} />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topTrending.map((trend, i) => (
          <Card key={trend.date} className="p-4 flex items-center gap-4">
            <div className={`size-10 rounded-xl flex items-center justify-center text-sm font-semibold ${trend.growth > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {trend.growth > 0 ? "↑" : "↓"}
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">{trend.date}</div>
              <div className="text-sm font-medium">Volume: {trend.volume.toLocaleString()}</div>
            </div>
            <div className="text-xs font-medium">{trend.growth > 0 ? "+" : ""}{trend.growth}%</div>
          </Card>
        ))}
      </div>
    </div>
  );
}