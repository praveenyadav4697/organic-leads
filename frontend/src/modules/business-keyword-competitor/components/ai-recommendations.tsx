import type { Recommendation } from "@/modules/business-keyword-competitor/types";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Sparkles, Rocket, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { STATUS_COLORS } from "@/modules/business-keyword-competitor/constants";

const RECOMMENDATION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  approved: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-info/10 text-info border-info/20",
};

interface AIRecommendationsProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onMarkComplete?: (id: string) => void;
}

export function AIRecommendations({ recommendations, isLoading, onApprove, onReject, onMarkComplete }: AIRecommendationsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-48 mb-2" />
            <div className="skeleton h-3 w-full mb-1" />
            <div className="skeleton h-3 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Sparkles className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No recommendations yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Run a research scan to generate AI recommendations.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <Card key={rec.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <div className="text-sm font-semibold">{rec.title}</div>
            </div>
            <Badge variant="outline" className={STATUS_COLORS[rec.priority]}>
              {rec.priority}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
            <div>
              <span className="text-muted-foreground">Impact:</span>{" "}
              <span className="font-medium">{rec.impact}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Est. Traffic:</span>{" "}
              <span className="font-medium">{rec.estimated_traffic ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Est. Leads:</span>{" "}
              <span className="font-medium">{rec.estimated_leads ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Difficulty:</span>{" "}
              <span className="font-medium">{rec.difficulty}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={RECOMMENDATION_STATUS_COLORS[rec.status] ?? ""}>
              {rec.status}
            </Badge>
            <div className="ml-auto flex items-center gap-1">
              {onApprove && rec.status === "pending" && (
                <Button variant="outline" size="sm" className="rounded-lg h-7 text-xs" onClick={() => onApprove(rec.id)}>
                  <CheckCircle2 className="size-3 mr-1" /> Approve
                </Button>
              )}
              {onReject && rec.status === "pending" && (
                <Button variant="outline" size="sm" className="rounded-lg h-7 text-xs" onClick={() => onReject(rec.id)}>
                  <XCircle className="size-3 mr-1" /> Reject
                </Button>
              )}
              {onMarkComplete && rec.status === "approved" && (
                <Button variant="outline" size="sm" className="rounded-lg h-7 text-xs" onClick={() => onMarkComplete(rec.id)}>
                  <Clock className="size-3 mr-1" /> Complete
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}