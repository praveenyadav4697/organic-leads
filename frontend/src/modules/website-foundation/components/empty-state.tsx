import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/40", className)} />;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-10 px-4">
      {Icon && (
        <div className="mx-auto size-12 rounded-2xl bg-muted/40 grid place-items-center mb-3 text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
      <div className="text-sm font-semibold">{title}</div>
      {description && <div className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{description}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description }: { title?: string; description?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <div className="font-semibold text-destructive">{title}</div>
      {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
    </motion.div>
  );
}
