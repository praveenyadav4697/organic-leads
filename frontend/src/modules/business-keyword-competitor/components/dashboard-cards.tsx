import type { MarketInsight } from "@/modules/business-keyword-competitor/types";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";

interface DashboardCardsProps {
  overview: MarketInsight | undefined;
  isLoading: boolean;
}

const emptyMarketInsight: MarketInsight = {
  total_keywords: 0,
  opportunity_score: null,
  total_competitors: 0,
  avg_position: null,
  search_visibility: null,
  estimated_traffic: null,
  content_gap_score: null,
  ai_confidence: null,
  last_scan: null,
  keyword_growth: 0,
  ranking_distribution: [],
  competition_distribution: [],
  search_intent_distribution: [],
  market_share: [],
};

export function DashboardCards({ overview, isLoading }: DashboardCardsProps) {
  const data = overview ?? emptyMarketInsight;

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Total Keywords" value={data.total_keywords} />
      <KpiCard label="Opportunity Score" value={data.opportunity_score ?? 0} />
      <KpiCard label="Competitors" value={data.total_competitors} />
      <KpiCard label="Avg Position" value={data.avg_position ?? 0} />
      <KpiCard label="Search Visibility" value={data.search_visibility ?? 0} />
      <KpiCard label="Est. Traffic" value={data.estimated_traffic ?? 0} />
      <KpiCard label="Content Gap Score" value={data.content_gap_score ?? 0} />
      <KpiCard label="AI Confidence" value={data.ai_confidence ?? 0} />
    </div>
  );
}
