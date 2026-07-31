import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import type { HistorySnapshot } from "@/modules/search-knowledge/types";

interface HistorySectionProps {
  data: HistorySnapshot[] | undefined;
  isLoading: boolean;
}

export function HistorySection({ data, isLoading }: HistorySectionProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  const snapshots = data ?? [];

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No history data available.</p>
      </div>
    );
  }

  const handleCompare = (id: string) => {
    if (compareMode) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
      );
    } else {
      setCompareMode(true);
      setSelected([id]);
    }
  };

  const metrics = ["entities", "topics", "keywords", "semanticScore", "visibility", "coverage"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {compareMode ? "Select snapshots to compare (max 2)" : "Click to select snapshots for comparison"}
        </p>
        {compareMode && (
          <Button variant="outline" size="sm" onClick={() => { setCompareMode(false); setSelected([]); }}>
            Exit Compare
          </Button>
        )}
      </div>

      {compareMode && selected.length === 2 && (
        <Card className="p-4 border-primary/30">
          <div className="text-sm font-semibold mb-3">Diff Viewer</div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-muted-foreground">Metric</div>
            {selected.map((id) => {
              const snap = snapshots.find((s) => s.id === id);
              return <div key={id} className="font-medium text-center">{snap?.scanDate ?? id}</div>;
            })}
            {metrics.map((metric) => {
              const values = selected.map((id) => {
                const snap = snapshots.find((s) => s.id === id);
                return (snap as any)?.[metric];
              });
              const diff = values[0] !== undefined && values[1] !== undefined ? values[1]! - values[0]! : 0;
              return (
                <React.Fragment key={metric}>
                  <div className="capitalize text-muted-foreground">{metric.replace(/([A-Z])/g, " $1").trim()}</div>
                  <div className="text-center">{values[0]}</div>
                  <div className={`text-center ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {diff > 0 ? "+" : ""}{diff}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {snapshots.map((snapshot, i) => (
          <motion.div
            key={snapshot.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={`p-5 cursor-pointer transition ${selected.includes(snapshot.id) ? "border-primary/50 bg-primary/5" : "hover:bg-muted/20"}`}
              onClick={() => handleCompare(snapshot.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{snapshot.scanDate}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {snapshot.entities} entities · {snapshot.topics} topics · {snapshot.keywords} keywords
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="text-center">
                    <div className="font-semibold">{snapshot.semanticScore}</div>
                    <div className="text-muted-foreground">Sem.</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{snapshot.visibility}</div>
                    <div className="text-muted-foreground">Vis.</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{snapshot.coverage}</div>
                    <div className="text-muted-foreground">Cov.</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}