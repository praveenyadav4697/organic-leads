import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ScanLog } from "@/modules/search-knowledge/types";
import { STATUS_COLORS } from "@/modules/search-knowledge/constants";

interface LogsSectionProps {
  data: { items: ScanLog[]; total: number; page: number; totalPages: number } | undefined;
  isLoading: boolean;
}

const TYPE_ICONS: Record<string, string> = {
  scan: "🔍",
  update: "🔄",
  error: "❌",
  warning: "⚠️",
  ai_event: "🤖",
};

export function LogsSection({ data, isLoading }: LogsSectionProps) {
  const [filter, setFilter] = useState("all");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-2xl" />
        ))}
      </div>
    );
  }

  const logs = data?.items ?? [];
  const filtered = filter === "all" ? logs : logs.filter((l) => l.type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {["all", "scan", "update", "error", "warning", "ai_event"].map((type) => (
          <Button
            key={type}
            variant={filter === type ? "default" : "outline"}
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => setFilter(type)}
          >
            {type === "all" ? "All" : TYPE_ICONS[type] ?? type} {type.replace("_", " ")}
          </Button>
        ))}
      </div>
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No log entries found.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-border ml-3 space-y-3">
            {filtered.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative"
              >
                <div className="absolute -left-[1.65rem] top-2 size-3 rounded-full border-2 border-border bg-card" />
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{TYPE_ICONS[log.type] ?? "📋"}</span>
                      <div>
                        <Badge variant="outline" className="text-[10px]">
                          {log.type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{log.timestamp}</span>
                  </div>
                  <p className="text-sm mt-2">{log.message}</p>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" disabled={data.page >= data.totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}