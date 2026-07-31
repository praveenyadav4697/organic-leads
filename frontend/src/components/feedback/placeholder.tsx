import { ReactNode } from "react";

/**
 * Renders the em dash placeholder when a value is null, undefined,
 * empty string, or "Not available from WordPress"-style sentinels.
 */
const PLACEHOLDER_SENTINELS = new Set([
  "",
  "Not available from WordPress",
  "Not available",
  "Not Available",
  "Not Yet Scanned",
  "not available",
  "n/a",
  "N/A",
  "unknown",
  "Unknown",
]);

export const PLACEHOLDER_DASH = "—";
export const PLACEHOLDER_NA = "Not Available";

export function isPlaceholderValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length === 0 || PLACEHOLDER_SENTINELS.has(trimmed);
  }
  return false;
}

interface PlaceholderProps {
  value: unknown;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Inline value display that shows `—` for missing values instead of nothing.
 * Use in cards, tables, fields, and lists.
 */
export function Placeholder({
  value,
  fallback = PLACEHOLDER_DASH,
  className,
}: PlaceholderProps) {
  if (isPlaceholderValue(value)) {
    return (
      <span
        className={
          "inline-flex items-center text-muted-foreground/70 " +
          (className ?? "")
        }
      >
        {fallback}
      </span>
    );
  }
  return <span className={className}>{String(value)}</span>;
}

/**
 * Field row: renders a label + value pair with a placeholder when missing.
 * Used to build dense metadata blocks (e.g. Website Info, WordPress Info).
 */
interface FieldRowProps {
  label: string;
  value?: unknown;
  fallback?: ReactNode;
  className?: string;
}

export function FieldRow({
  label,
  value,
  fallback = PLACEHOLDER_DASH,
  className,
}: FieldRowProps) {
  return (
    <div
      className={
        "flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-0 " +
        (className ?? "")
      }
    >
      <dt className="text-sm font-medium text-muted-foreground min-w-[140px]">
        {label}
      </dt>
      <dd className="text-sm text-right break-words">
        <Placeholder value={value} fallback={fallback} />
      </dd>
    </div>
  );
}
