import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Competitor } from "@/modules/search-knowledge/types";
import { STATUS_COLORS } from "@/modules/search-knowledge/constants";

interface CompetitorsSectionProps {
  data: Competitor[] | undefined;
  isLoading: boolean;
}

export function CompetitorsSection({ data, isLoading }: CompetitorsSectionProps) {
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

  const competitors = data ?? [];

  if (competitors.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No competitor data available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {competitors.map((comp, i) => (
        <motion.div
          key={comp.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Badge className="rounded-xl" variant="outline">
            #{comp.ranking}
          </Badge>
          <div className="rounded-2xl border border-border bg-card p-5 mt-2 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">{comp.name}</h3>
              <p className="text-xs text-muted-foreground">{comp.domain}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Authority</span>
                <span>{comp.authority}/100</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${comp.authority}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-sm font-semibold">{comp.topics}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Topics</div>
              </div>
              <div>
                <div className="text-sm font-semibold">{comp.keywords}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Keywords</div>
              </div>
              <div>
                <div className="text-sm font-semibold">{comp.overlap}%</div>
                <div className="text-[10px] text-muted-foreground uppercase">Overlap</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Gap score</span>
              <Badge variant="outline" className={comp.gapScore > 70 ? "bg-destructive/10 text-destructive" : comp.gapScore > 40 ? "bg-warning/15 text-warning-foreground" : "bg-success/10 text-success"}>
                {comp.gapScore}/100
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full rounded-xl">Analyze</Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}