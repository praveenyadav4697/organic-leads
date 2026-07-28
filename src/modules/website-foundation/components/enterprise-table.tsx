import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  align?: "left" | "right" | "center";
}

export interface EnterpriseTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: ((row: T) => string)[];
  toolbar?: ReactNode;
  emptyState?: ReactNode;
  pageSize?: number;
  stickyHeader?: boolean;
  exportable?: boolean;
  onExport?: (format: "csv" | "xlsx" | "pdf") => void;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

type SortDir = "asc" | "desc" | null;

export function EnterpriseTable<T>({
  data,
  columns,
  searchPlaceholder = "Search…",
  searchKeys,
  toolbar,
  emptyState,
  pageSize = 8,
  stickyHeader = true,
  exportable = true,
  onExport,
  rowKey,
  onRowClick,
}: EnterpriseTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query) return data;
    const q = query.toLowerCase();
    if (searchKeys && searchKeys.length) {
      return data.filter((row) => searchKeys.some((k) => k(row).toLowerCase().includes(q)));
    }
    return data;
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find((c) => c.id === sortKey);
    if (!col?.sortValue) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const onSort = (id: string) => {
    if (sortKey !== id) {
      setSortKey(id);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 border-b border-border bg-muted/20">
        <div className="relative flex-1 max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 rounded-xl h-9" placeholder={searchPlaceholder} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        </div>
        {toolbar}
        {exportable && (
          <div className="flex items-center gap-1 ml-auto">
            <Button size="sm" variant="outline" className="rounded-lg h-9" onClick={() => onExport?.("csv")}>
              <Download className="size-3.5" /> CSV
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg h-9" onClick={() => onExport?.("xlsx")}>
              <FileSpreadsheet className="size-3.5" /> Excel
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg h-9" onClick={() => onExport?.("pdf")}>
              <FileText className="size-3.5" /> PDF
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={cn("bg-muted/30 text-muted-foreground", stickyHeader && "sticky top-0 z-10")}>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.id}
                  className={cn(
                    "px-4 py-3 text-[11px] uppercase tracking-widest font-medium select-none",
                    c.align === "right" && "text-right",
                    c.align === "center" && "text-center",
                    (!c.align || c.align === "left") && "text-left",
                    c.sortValue && "cursor-pointer hover:text-foreground",
                  )}
                  onClick={() => c.sortValue && onSort(c.id)}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortValue && (
                      sortKey !== c.id ? <ChevronsUpDown className="size-3" /> :
                      sortDir === "asc" ? <ChevronUp className="size-3" /> :
                      sortDir === "desc" ? <ChevronDown className="size-3" /> : null
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  {emptyState ?? (
                    <div className="text-center text-sm text-muted-foreground">No results.</div>
                  )}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    "border-t border-border/60 hover:bg-muted/30 transition",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={cn(
                        "px-4 py-3 align-middle",
                        c.align === "right" && "text-right",
                        c.align === "center" && "text-center",
                        c.className,
                      )}
                    >
                      {c.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
        <div>
          Showing {pageRows.length === 0 ? 0 : (page - 1) * pageSize + 1}–{(page - 1) * pageSize + pageRows.length} of {sorted.length}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="rounded-lg h-8" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <span className="px-2">Page {page} of {totalPages}</span>
          <Button size="sm" variant="ghost" className="rounded-lg h-8" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      </div>
    </div>
  );
}
