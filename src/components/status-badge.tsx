import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    connected: "bg-success/10 text-success border-success/20",
    disconnected: "bg-muted text-muted-foreground border-border",
    pending: "bg-warning/10 text-warning-foreground border-warning/30",
    good: "bg-success/10 text-success border-success/20",
    warn: "bg-warning/15 text-warning-foreground border-warning/30",
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/15 text-warning-foreground border-warning/30",
    low: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        map[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}
