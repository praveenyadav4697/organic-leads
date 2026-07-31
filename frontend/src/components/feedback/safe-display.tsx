import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart as BarChartIcon } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "./feedback-states";

/* -------------------------------------------------------------------------- */
/*                                SafeTable                                   */
/* -------------------------------------------------------------------------- */

export interface SafeColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface SafeTableProps<T> {
  columns: SafeColumn<T>[];
  rows?: T[] | null | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey?: (row: T, index: number) => string;
  className?: string;
}

/**
 * Table that always renders its header row.
 * Body shows a loading / empty / error message in place of hiding rows.
 */
export function SafeTable<T>({
  columns,
  rows,
  isLoading,
  isError,
  onRetry,
  emptyTitle = "No data available",
  emptyDescription = "No rows to display.",
  rowKey,
  className,
}: SafeTableProps<T>) {
  const data = Array.isArray(rows) ? rows : [];

  return (
    <div className={"rounded-xl border border-border/50 overflow-hidden " + (className ?? "")}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className={c.className}>
                {c.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <ErrorState
                  className="border-0 bg-transparent"
                  title="Unable to load data"
                  description="This section failed to load."
                  onRetry={onRetry}
                />
              </TableCell>
            </TableRow>
          ) : isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <LoadingState message="Loading data…" className="justify-center" />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="p-0">
                <EmptyState
                  title={emptyTitle}
                  description={emptyDescription}
                  className="py-6"
                />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow key={rowKey ? rowKey(row, idx) : `${idx}`}>
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render ? c.render(row) : (row as any)[c.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SafeChart                                   */
/* -------------------------------------------------------------------------- */

interface SafeChartProps {
  title?: string;
  description?: string;
  height?: number;
  isLoading?: boolean;
  isError?: boolean;
  hasData?: boolean;
  onRetry?: () => void;
  children: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

/**
 * Chart wrapper that always renders a container.
 * Replaces chart contents with a placeholder when data is missing.
 */
export function SafeChart({
  title,
  description,
  height = 240,
  isLoading,
  isError,
  hasData,
  onRetry,
  children,
  emptyTitle = "No chart data available",
  emptyDescription = "Run a scan to populate this chart.",
  className,
}: SafeChartProps) {
  return (
    <div
      className={
        "rounded-xl border border-border/50 bg-card p-4 " + (className ?? "")
      }
    >
      {title && <div className="text-sm font-semibold mb-1">{title}</div>}
      {description && (
        <div className="text-xs text-muted-foreground mb-3">{description}</div>
      )}
      <div style={{ minHeight: height }}>
        {isError ? (
          <ErrorState
            className="border-0 bg-transparent"
            onRetry={onRetry}
            title="Unable to load chart"
          />
        ) : isLoading ? (
          <LoadingState message="Loading chart…" />
        ) : hasData ? (
          children
        ) : (
          <EmptyState
            icon={<BarChartIcon className="size-5" />}
            title={emptyTitle}
            description={emptyDescription}
          />
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                StatsRow                                    */
/* -------------------------------------------------------------------------- */

interface Stat {
  label: string;
  value?: ReactNode;
  unit?: string;
  delta?: number;
  hint?: string;
}

interface StatsRowProps {
  stats: Stat[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * KPI row that always renders the card layout.
 * Missing values show `—` instead of blank.
 */
export function StatsRow({
  stats,
  isLoading,
  isError,
  onRetry,
}: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {isError && stats.length === 0 ? (
        <ErrorState onRetry={onRetry} className="col-span-full" />
      ) : (
        stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="text-xs font-medium text-muted-foreground">
              {s.label}
            </div>
            <div className="mt-2 flex items-baseline gap-1 text-2xl font-semibold">
              {isLoading ? (
                <span className="inline-block h-6 w-12 rounded bg-muted/50 animate-pulse" />
              ) : s.value === undefined || s.value === null || s.value === "" ? (
                <span className="text-muted-foreground/70">—</span>
              ) : (
                <>
                  {s.value}
                  {s.unit && (
                    <span className="text-sm text-muted-foreground">
                      {s.unit}
                    </span>
                  )}
                </>
              )}
            </div>
            {s.hint && (
              <div className="text-[11px] text-muted-foreground mt-1">
                {s.hint}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
