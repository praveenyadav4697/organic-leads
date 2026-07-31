import type { SearchTrend, Keyword, Competitor, KeywordIntent } from "@/modules/business-keyword-competitor/types";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, PieChart, BarChart3, LineChart } from "lucide-react";

interface KeywordGrowthChartProps {
  data: SearchTrend[];
}

export function KeywordGrowthChart({ data }: KeywordGrowthChartProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="size-4 text-primary" />
        <span className="text-sm font-semibold">Keyword Growth Trend</span>
      </div>
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        {data.length > 0 ? "Chart visualization" : "No trend data available."}
      </div>
    </Card>
  );
}

interface RankingDistributionChartProps {
  data: { position: string; count: number }[];
}

export function RankingDistributionChart({ data }: RankingDistributionChartProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="size-4 text-primary" />
        <span className="text-sm font-semibold">Ranking Distribution</span>
      </div>
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        {data.length > 0 ? "Chart visualization" : "No ranking data available."}
      </div>
    </Card>
  );
}

interface CompetitionDistributionChartProps {
  data: { level: string; count: number }[];
}

export function CompetitionDistributionChart({ data }: CompetitionDistributionChartProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="size-4 text-primary" />
        <span className="text-sm font-semibold">Competition Distribution</span>
      </div>
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        {data.length > 0 ? "Chart visualization" : "No competition data available."}
      </div>
    </Card>
  );
}

interface IntentDistributionChartProps {
  data: { intent: string; count: number }[];
}

export function IntentDistributionChart({ data }: IntentDistributionChartProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="size-4 text-primary" />
        <span className="text-sm font-semibold">Search Intent Distribution</span>
      </div>
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        {data.length > 0 ? "Chart visualization" : "No intent data available."}
      </div>
    </Card>
  );
}

interface MarketShareChartProps {
  data: { competitor: string; share: number }[];
}

export function MarketShareChart({ data }: MarketShareChartProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <LineChart className="size-4 text-primary" />
        <span className="text-sm font-semibold">Market Share</span>
      </div>
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        {data.length > 0 ? "Chart visualization" : "No market share data available."}
      </div>
    </Card>
  );
}