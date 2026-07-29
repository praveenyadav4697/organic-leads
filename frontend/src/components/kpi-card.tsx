import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => v.toFixed(decimals));
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.1, ease: "easeOut" });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span>{rounded}</motion.span>;
}

export function ProgressRing({ value, size = 56 }: { value: number; size?: number }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(value, 100) / 100) * c;
  return (
    <svg width={size} height={size} className="shrink-0">
      <defs>
        <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-muted)" strokeWidth={stroke} fill="none" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="url(#ring-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.1, ease: "easeOut" }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  unit,
  delta,
  hint,
  ring = true,
  index = 0,
}: {
  label: string;
  value: number;
  unit?: string;
  delta?: number;
  hint?: string;
  ring?: boolean;
  index?: number;
}) {
  const trend = (delta ?? 0) > 0 ? "up" : (delta ?? 0) < 0 ? "down" : "flat";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-border bg-card p-5 card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
          <div className="mt-2 flex items-baseline gap-1">
            <div className="text-3xl font-semibold tracking-tight">
              <CountUp value={value} />
            </div>
            {unit && <div className="text-sm text-muted-foreground">{unit}</div>}
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground truncate">{hint}</div>}
        </div>
        {ring && <ProgressRing value={typeof value === "number" && unit === "%" ? value : Math.min(100, value * 10)} />}
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
