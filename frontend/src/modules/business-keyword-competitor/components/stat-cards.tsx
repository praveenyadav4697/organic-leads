import type { MarketInsight } from "@/modules/business-keyword-competitor/types";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";

interface StatCardsProps {
  overview: MarketInsight | undefined;
  isLoading: boolean;
}

export function StatCards({ overview, isLoading }: StatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-8 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Total Keywords" value={overview.total_keywords} />
      <KpiCard label="Opportunity Score" value={overview.opportunity_score ?? 0} />
      <KpiCard label="Competitors" value={overview.total_competitors} />
      <KpiCard label="Avg Position" value={overview.avg_position ?? 0} />
      <KpiCard label="Search Visibility" value={overview.search_visibility ?? 0} />
      <KpiCard label="Est. Traffic" value={overview.estimated_traffic ?? 0} />
      <KpiCard label="Content Gap Score" value={overview.content_gap_score ?? 0} />
      <KpiCard label="AI Confidence" value={overview.ai_confidence ?? 0} />
    </div>
  );
}