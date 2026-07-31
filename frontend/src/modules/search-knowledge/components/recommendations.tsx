import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, X, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Recommendation } from "@/modules/search-knowledge/types";
import { STATUS_COLORS, PRIORITY_ORDER } from "@/modules/search-knowledge/constants";

interface RecommendationsSectionProps {
  data: Recommendation[] | undefined;
  isLoading: boolean;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onMarkComplete?: (id: string) => void;
}

const statusColorMap: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-info/10 text-info border-info/20",
};

export function RecommendationsSection({ data, isLoading, onAccept, onReject, onMarkComplete }: RecommendationsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  const recs = [...(data ?? [])].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  if (recs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No recommendations available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recs.map((rec, i) => (
        <Card key={rec.id} className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={STATUS_COLORS[rec.priority]}>{rec.priority}</Badge>
                  <Badge variant="outline" className={statusColorMap[rec.status] ?? statusColorMap.pending}>
                    {rec.status}
                  </Badge>
              </div>
              <h3 className="text-sm font-semibold mb-1">{rec.title}</h3>
              <p className="text-xs text-muted-foreground mb-2">{rec.description}</p>
              <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span>Impact: {rec.impact}</span>
                <span>Difficulty: {rec.difficulty}</span>
                <span>Est. Traffic: +{rec.estimatedTraffic}/mo</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {rec.status === "pending" && (
                <>
                  <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={() => onAccept?.(rec.id)}>
                    <Check className="size-3" /> Accept
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={() => onReject?.(rec.id)}>
                    <X className="size-3" /> Reject
                  </Button>
                </>
              )}
              {rec.status !== "pending" && (
                <Button variant="ghost" size="sm" className="rounded-xl h-8" onClick={() => onMarkComplete?.(rec.id)}>
                  <RotateCcw className="size-3" /> Mark Pending
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}