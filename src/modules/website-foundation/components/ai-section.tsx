import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiService } from "../services";
import type { AIInsight } from "../types";
import { cn } from "@/lib/utils";

export function AISection({
  title = "AI insights",
  kind,
  className,
  full = false,
}: {
  title?: string;
  kind?: AIInsight["kind"];
  className?: string;
  full?: boolean;
}) {
  const [data, setData] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const all = await aiService.list();
    setData(kind ? all.filter((a) => a.kind === kind) : all);
    setLoading(false);
  };

  useEffect(() => { load(); }, [kind]);

  const visible = full ? data : data.slice(0, 3);

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold flex items-center gap-2">
          <span className="size-7 rounded-lg gradient-primary grid place-items-center text-white">
            <Sparkles className="size-3.5" />
          </span>
          {title}
        </div>
        <Button variant="ghost" size="sm" className="rounded-lg" onClick={load}>
          <RefreshCw className="size-3.5" /> Refresh
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
        ))}
        {!loading && visible.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border p-3 hover:bg-muted/30 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{a.body}</div>
              </div>
              <div className="shrink-0 text-[10px] text-muted-foreground rounded-md bg-muted/50 px-1.5 py-0.5">
                {Math.round(a.confidence * 100)}% confidence
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-primary">{a.kind}</span>
              <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Apply <ArrowRight className="size-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
