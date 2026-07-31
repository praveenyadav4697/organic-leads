import type { Keyword, KeywordIntent, KeywordPriority, KeywordDifficulty } from "@/modules/business-keyword-competitor/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, SortAsc, SortDesc, ArrowUpRight, ArrowDownRight, Minus,
  Trash2, Edit3, ChevronLeft, ChevronRight,
} from "lucide-react";
import { INTENT_COLORS, DIFFICULTY_COLORS, STATUS_COLORS } from "@/modules/business-keyword-competitor/constants";

interface KeywordsTableProps {
  keywords: Keyword[];
  isLoading: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSort: (field: string) => void;
  sortBy: string;
  sortOrder: string;
  onEdit?: (keyword: Keyword) => void;
  onDelete?: (keywordId: string) => void;
}

export function KeywordsTable({ keywords, isLoading, total, page, totalPages, onPageChange, onSort, sortBy, sortOrder, onEdit, onDelete }: KeywordsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = keywords.filter((kw: Keyword) =>
    kw.keyword_text.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Badge variant="outline">{total} keywords</Badge>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox /></TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort("keyword_text")}>
                Keyword {sortBy === "keyword_text" && (sortOrder === "asc" ? <SortAsc className="size-3 inline ml-1" /> : <SortDesc className="size-3 inline ml-1" />)}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort("search_volume")}>
                Volume {sortBy === "search_volume" && (sortOrder === "asc" ? <SortAsc className="size-3 inline ml-1" /> : <SortDesc className="size-3 inline ml-1" />)}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => onSort("keyword_difficulty")}>
                Difficulty {sortBy === "keyword_difficulty" && (sortOrder === "asc" ? <SortAsc className="size-3 inline ml-1" /> : <SortDesc className="size-3 inline ml-1" />)}
              </TableHead>
              <TableHead>CPC</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((kw: Keyword) => (
              <TableRow key={kw.id}>
                <TableCell><Checkbox checked={selected.has(kw.id)} onCheckedChange={(checked: boolean) => {
                  const next = new Set(selected);
                  if (checked) next.add(kw.id); else next.delete(kw.id);
                  setSelected(next);
                }} /></TableCell>
                <TableCell className="font-medium">{kw.keyword_text}</TableCell>
                <TableCell>{kw.search_volume?.toLocaleString() ?? "—"}</TableCell>
                <TableCell>
                  {kw.keyword_difficulty && (
                    <Badge variant="outline" className={DIFFICULTY_COLORS[kw.keyword_difficulty] ?? ""}>
                      {kw.keyword_difficulty}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{kw.cpc != null ? `$${kw.cpc.toFixed(2)}` : "—"}</TableCell>
                <TableCell>
                  {kw.keyword_intent && (
                    <Badge variant="outline" className={INTENT_COLORS[kw.keyword_intent] ?? ""}>
                      {kw.keyword_intent}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {kw.priority && (
                    <Badge variant="outline" className={STATUS_COLORS[kw.priority] ?? ""}>
                      {kw.priority}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {kw.current_rank != null ? (
                    <span className={kw.current_rank <= 10 ? "text-success font-medium" : "text-muted-foreground"}>
                      #{kw.current_rank}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  {kw.opportunity_score != null ? (
                    <span className={kw.opportunity_score >= 70 ? "text-success font-medium" : kw.opportunity_score >= 40 ? "text-warning-foreground font-medium" : "text-muted-foreground"}>
                      {kw.opportunity_score}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  {kw.trend === "up" && <ArrowUpRight className="size-4 text-success" />}
                  {kw.trend === "down" && <ArrowDownRight className="size-4 text-destructive" />}
                  {kw.trend === "stable" && <Minus className="size-4 text-muted-foreground" />}
                  {!kw.trend && "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(kw)}>
                        <Edit3 className="size-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onDelete(kw.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground text-sm">
                  No keywords found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Showing {filtered.length} of {total} keywords</span>
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