import { ReactNode } from "react";
import { Inbox, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inline (non-blocking) empty state.
 * Use inside cards, tables, panels — never replaces the whole page.
 */
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No data available",
  description = "Run your first scan to populate this page.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center text-center gap-2 py-8 px-4 " +
        (className ?? "")
      }
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full bg-muted/50 p-3 text-muted-foreground">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}

/**
 * Inline error state.
 * Use when an individual component failed to load — does not unmount the page.
 */
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Unable to load data",
  description = "Something went wrong while fetching this section.",
  onRetry,
  retryLabel = "Retry",
  className,
}: ErrorStateProps) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center text-center gap-2 py-8 px-4 border border-destructive/30 rounded-xl bg-destructive/5 " +
        (className ?? "")
      }
      role="alert"
    >
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground max-w-sm">{description}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2"
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * Inline loading placeholder.
 * Renders a skeleton-style hint inside a component without hiding layout.
 */
interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={
        "flex items-center gap-2 text-xs text-muted-foreground py-3 " +
        (className ?? "")
      }
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-3 animate-spin" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Page-level fallback for full-page loaders.
 * NOTE: prefer preserving the layout (header/sections) rather than using this.
 */
interface PageLoadingProps {
  title?: string;
  description?: string;
}

export function PageLoading({ title, description }: PageLoadingProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {title && (
          <div className="h-7 w-1/3 rounded-md bg-muted/50 animate-pulse" />
        )}
        {description && (
          <div className="h-4 w-2/3 rounded-md bg-muted/40 animate-pulse" />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-muted/40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
