import type { Competitor, CompetitorRelationship } from "@/modules/business-keyword-competitor/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Globe, ShieldCheck, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Trash2, Edit3 } from "lucide-react";
import { STATUS_COLORS } from "@/modules/business-keyword-competitor/constants";

const RELATIONSHIP_COLORS: Record<string, string> = {
  direct: "bg-success/10 text-success border-success/20",
  indirect: "bg-warning/15 text-warning-foreground border-warning/30",
  aspirational: "bg-info/10 text-info border-info/20",
};

interface CompetitorsSectionProps {
  competitors: Competitor[];
  isLoading: boolean;
  onEdit?: (competitor: Competitor) => void;
  onDelete?: (competitorId: string) => void;
}

export function CompetitorsSection({ competitors, isLoading, onEdit, onDelete }: CompetitorsSectionProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-32 mb-3" />
            <div className="skeleton h-3 w-full mb-2" />
            <div className="skeleton h-3 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No competitors added yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Add competitor domains to start analyzing.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {competitors.map((comp) => (
        <Card key={comp.id} className="p-4 card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <div className="text-sm font-semibold">{comp.competitor_name}</div>
            </div>
            <Badge variant="outline" className={RELATIONSHIP_COLORS[comp.relationship_type] ?? ""}>
              {comp.relationship_type}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground font-mono truncate mb-3">{comp.competitor_domain}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground">Authority</div>
              <div className="font-semibold">{comp.authority_score ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Organic Traffic</div>
              <div className="font-semibold">{comp.organic_traffic?.toLocaleString() ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Keywords</div>
              <div className="font-semibold">{comp.organic_keywords?.toLocaleString() ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Backlinks</div>
              <div className="font-semibold">{comp.backlinks_count?.toLocaleString() ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Position</div>
              <div className="font-semibold">{comp.avg_position ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Visibility</div>
              <div className="font-semibold">{comp.visibility_score ?? "—"}%</div>
            </div>
          </div>
          {comp.market_share != null && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Market Share</span>
                <span className="font-semibold">{comp.market_share}%</span>
              </div>
            </div>
          )}
          <div className="mt-3 flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(comp)}>
                <Edit3 className="size-3" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(comp.id)}>
                <Trash2 className="size-3" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}