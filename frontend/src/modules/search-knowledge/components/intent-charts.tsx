import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { IntentDistribution } from "@/modules/search-knowledge/types";
import { KeywordIntentChart } from "@/modules/search-knowledge/components/charts";

interface IntentChartSectionProps {
  data: IntentDistribution | undefined;
  isLoading: boolean;
}

export function IntentChartSection({ data, isLoading }: IntentChartSectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No intent data available.</p>
      </div>
    );
  }

  const total = data.informational + data.navigational + data.commercial + data.transactional + data.questionBased || 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <div className="text-sm font-semibold mb-3">Intent Distribution</div>
        <KeywordIntentChart data={data} />
      </Card>
      <Card className="p-5">
        <div className="text-sm font-semibold mb-3">Breakdown</div>
        <div className="space-y-3">
          {[
            { label: "Informational", value: data.informational, pct: (data.informational / total) * 100 },
            { label: "Navigational", value: data.navigational, pct: (data.navigational / total) * 100 },
            { label: "Commercial", value: data.commercial, pct: (data.commercial / total) * 100 },
            { label: "Transactional", value: data.transactional, pct: (data.transactional / total) * 100 },
            { label: "Question Based", value: data.questionBased, pct: (data.questionBased / total) * 100 },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value} ({item.pct.toFixed(1)}%)</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: "hsl(var(--primary))" }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}