import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/kpi-card";

export function VitalsRing({
  label,
  value,
  target,
  unit,
  intent = "primary",
  size = 88,
  className,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
  intent?: "primary" | "success" | "warning";
  size?: number;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / target) * 100));
  const tone = intent === "success" ? "text-success" : intent === "warning" ? "text-warning" : "text-primary";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("rounded-2xl border border-border bg-card p-4 flex items-center gap-3", className)}
    >
      <ProgressRing value={pct} size={size} />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={cn("text-xl font-semibold mt-1", tone)}>
          {value}
          <span className="text-xs text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">Target ≤ {target}{unit}</div>
      </div>
    </motion.div>
  );
}
