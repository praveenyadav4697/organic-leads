import type { SEOPage, SEOPageUpdate } from "@/modules/onpage-seo/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, SortAsc, SortDesc, ArrowUpRight, ArrowDownRight, Minus,
  Trash2, Edit3, Eye, ChevronLeft, ChevronRight,
} from "lucide-react";
import { STATUS_COLORS, SEVERITY_COLORS } from "@/modules/onpage-seo/constants";

interface PagesTableProps {
  pages: SEOPage[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: string;
  onEdit?: (page: SEOPage) => void;
  onDelete?: (pageId: string) => void;
  onView?: (pageId: string) => void;
}

export function PagesTable({ pages, isLoading, total, page, totalPages, onPageChange, onSort, sortBy, sortOrder, onEdit, onDelete, onView }: PagesTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = pages.filter((p) =>
    p.url.toLowerCase().includes(search.toLowerCase()) ||
    p.path.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <div className="skeleton h-4 w-4" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-16" />
            <div className="skeleton h-4 w-12" />
            <div className="skeleton h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline">{total} pages</Badge>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort("url")}>
                Page URL {sortBy === "url" && (sortOrder === "asc" ? <SortAsc className="size-3 inline ml-1" /> : <SortDesc className="size-3 inline ml-1" />)}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort("seo_score")}>
                SEO Score {sortBy === "seo_score" && (sortOrder === "asc" ? <SortAsc className="size-3 inline ml-1" /> : <SortDesc className="size-3 inline ml-1" />)}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Keyword</TableHead>
              <TableHead>Words</TableHead>
              <TableHead>Readability</TableHead>
              <TableHead>Schema</TableHead>
              <TableHead>Canonical</TableHead>
              <TableHead>Indexed</TableHead>
              <TableHead>Last Audit</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell><Checkbox checked={selected.has(p.id)} onCheckedChange={(checked: boolean) => {
                  const next = new Set(selected);
                  if (checked) next.add(p.id); else next.delete(p.id);
                  setSelected(next);
                }} /></TableCell>
                <TableCell className="font-mono text-xs truncate max-w-[200px]">{p.url}</TableCell>
                <TableCell>
                  {p.seo_score != null ? (
                    <span className={p.seo_score >= 80 ? "text-success font-medium" : p.seo_score >= 50 ? "text-warning-foreground font-medium" : "text-destructive font-medium"}>
                      {p.seo_score}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_COLORS[p.status] ?? ""}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{p.primary_keyword ?? "—"}</TableCell>
                <TableCell>{p.word_count ?? "—"}</TableCell>
                <TableCell>{p.readability_score != null ? p.readability_score : "—"}</TableCell>
                <TableCell>{p.has_schema ? <Badge variant="outline" className="bg-success/10 text-success">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                <TableCell>{p.has_canonical ? <Badge variant="outline" className="bg-success/10 text-success">Yes</Badge> : <Badge variant="outline">No</Badge>}</TableCell>
                <TableCell>{p.is_indexed === true ? <Badge variant="outline" className="bg-success/10 text-success">Yes</Badge> : p.is_indexed === false ? <Badge variant="outline" className="bg-destructive/10 text-destructive">No</Badge> : <Badge variant="outline">—</Badge>}</TableCell>
                <TableCell className="text-xs">{p.last_audit ? new Date(p.last_audit).toLocaleDateString() : "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {onView && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onView(p.id)}>
                        <Eye className="size-3" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onEdit(p)}>
                        <Edit3 className="size-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDelete(p.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground text-sm">
                  No pages found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filtered.length} of {total} pages</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="size-3" /> Prev
          </Button>
          <span className="px-2 py-1 text-xs">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}