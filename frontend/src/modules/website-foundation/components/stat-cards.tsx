import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  index?: number;
  intent?: "primary" | "success" | "warning" | "danger" | "info";
}

export function StatCard({ label, value, unit, delta, hint, icon: Icon, index = 0, intent = "primary" }: StatCardProps) {
  const trend = (delta ?? 0) > 0 ? "up" : (delta ?? 0) < 0 ? "down" : "flat";
  const intentBg = {
    primary: "from-primary/8 to-accent/8",
    success: "from-success/8 to-primary/8",
    warning: "from-warning/8 to-accent/8",
    danger: "from-destructive/8 to-warning/8",
    info: "from-info/8 to-primary/8",
  }[intent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border border-border bg-card p-5 card-hover relative overflow-hidden",
      )}
    >
      <div aria-hidden className={cn("absolute -top-12 -right-12 size-32 rounded-full opacity-50 blur-3xl bg-gradient-to-br", intentBg)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <div className="text-2xl md:text-3xl font-semibold tracking-tight">{value}</div>
            {unit && <div className="text-sm text-muted-foreground">{unit}</div>}
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground truncate">{hint}</div>}
        </div>
        {Icon && (
          <div className="size-10 rounded-xl bg-muted/40 grid place-items-center text-primary shrink-0">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      {delta !== undefined && (
        <div
          className={cn(
            "mt-4 inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1",
            trend === "up" && "bg-success/10 text-success",
            trend === "down" && "bg-destructive/10 text-destructive",
            trend === "flat" && "bg-muted text-muted-foreground",
          )}
        >
          {trend === "up" && <ArrowUpRight className="size-3" />}
          {trend === "down" && <ArrowDownRight className="size-3" />}
          {trend === "flat" && <Minus className="size-3" />}
          {delta > 0 ? "+" : ""}
          {delta}% vs last week
        </div>
      )}
    </motion.div>
  );
}
