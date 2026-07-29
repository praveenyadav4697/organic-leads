import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";

export function Pill({
  children,
  intent = "neutral",
  className,
}: {
  children: React.ReactNode;
  intent?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const map = {
    neutral: "bg-muted/40 text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info/10 text-info",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", map[intent], className)}>
      {children}
    </span>
  );
}

export function StatusPill({ status, label }: { status: "good" | "warn" | "bad" | "info"; label?: string }) {
  return <StatusBadge status={status} />;
}
