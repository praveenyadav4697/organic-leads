import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Keyword, PaginatedKeywords } from "@/modules/search-knowledge/types";
import { STATUS_COLORS } from "@/modules/search-knowledge/constants";

interface KeywordsTableProps {
  data: PaginatedKeywords | undefined;
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
}

export function KeywordsTable({ data, isLoading, search, onSearchChange }: KeywordsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const filtered = (data?.items ?? []).filter(
    (k) => k.keyword.toLowerCase().includes(search.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No keywords found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search keywords..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm rounded-xl"
        />
        <span className="text-xs text-muted-foreground">{data?.total ?? 0} keywords</span>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>CPC</TableHead>
              <TableHead>Ranking</TableHead>
              <TableHead>Trend</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((kw) => (
              <TableRow key={kw.id} className="hover:bg-muted/30 transition">
                <TableCell className="font-medium">{kw.keyword}</TableCell>
                <TableCell>{kw.volume.toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${kw.difficulty}%`, background: kw.difficulty > 70 ? "hsl(var(--destructive))" : kw.difficulty > 40 ? "hsl(var(--warning))" : "hsl(var(--primary))" }} />
                    </div>
                    <span className="text-xs">{kw.difficulty}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-info/10 text-info border-info/20">{kw.intent}</Badge>
                </TableCell>
                <TableCell className="text-xs">${kw.cpc.toFixed(2)}</TableCell>
                <TableCell>{kw.ranking > 0 ? `#${kw.ranking}` : "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={kw.trend === "up" ? "bg-success/10 text-success" : kw.trend === "down" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}>
                    {kw.trend === "up" ? "↑" : kw.trend === "down" ? "↓" : "→"} {kw.trend}
                  </Badge>
                </TableCell>
                <TableCell><Badge variant="outline" className={STATUS_COLORS[kw.status]}>{kw.status.replace("_", " ")}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.page} of {data.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.page <= 1}>Previous</Button>
            <Button variant="outline" size="sm" disabled={data.page >= data.totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}