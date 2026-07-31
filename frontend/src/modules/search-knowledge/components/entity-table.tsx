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
import type { Entity, PaginatedEntities } from "@/modules/search-knowledge/types";
import { STATUS_COLORS } from "@/modules/search-knowledge/constants";

interface EntityTableProps {
  data: PaginatedEntities | undefined;
  isLoading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
}

export function EntityTable({ data, isLoading, search, onSearchChange }: EntityTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const filtered = (data?.items ?? []).filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.type.toLowerCase().includes(search.toLowerCase())
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No entities found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search entities..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm rounded-xl"
        />
        <span className="text-xs text-muted-foreground">
          {data?.total ?? 0} entities
        </span>
      </div>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Mentions</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((entity) => (
              <TableRow key={entity.id} className="hover:bg-muted/30 transition">
                <TableCell className="font-medium">{entity.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-full">{entity.entityType}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${entity.confidence * 100}%` }} />
                    </div>
                    <span className="text-xs">{(entity.confidence * 100).toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell>{entity.mentions}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{entity.source}</TableCell>
                <TableCell><Badge variant="outline" className={STATUS_COLORS[entity.status]}>{entity.status}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{entity.updatedAt}</TableCell>
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