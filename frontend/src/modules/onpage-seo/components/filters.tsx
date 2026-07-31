import type { SEOFilters } from "@/modules/onpage-seo/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FiltersPanelProps {
  filters: SEOFilters;
  onFiltersChange: (filters: SEOFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const STATUS_OPTIONS = ["scanned", "error", "pending", "skipped"];
const SEVERITY_OPTIONS = ["critical", "high", "medium", "low"];
const CONTENT_TYPE_OPTIONS = ["page", "post", "product", "category", "tag", "landing"];
const SCHEMA_TYPE_OPTIONS = [
  "Organization", "Website", "Article", "FAQ", "Breadcrumb", "Product",
  "Review", "Event", "Video", "LocalBusiness", "Person", "JobPosting",
  "Course", "HowTo", "Recipe", "SoftwareApplication",
];

export function FiltersPanel({ filters, onFiltersChange, onApply, onReset }: FiltersPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hasActiveFilters =
    !!filters.search ||
    !!filters.website ||
    !!filters.page ||
    !!filters.category ||
    !!filters.status ||
    !!filters.severity ||
    !!filters.keyword ||
    !!filters.template ||
    !!filters.language ||
    !!filters.content_type ||
    !!filters.schema_type ||
    !!filters.date_from ||
    !!filters.date_to;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => setExpanded(!expanded)}
        >
          <Filter className="size-3 mr-1" />
          Filters
          {hasActiveFilters && <Badge variant="secondary" className="ml-1">Active</Badge>}
          {expanded ? <ChevronUp className="size-3 ml-1" /> : <ChevronDown className="size-3 ml-1" />}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="rounded-xl text-xs" onClick={onReset}>
            <X className="size-3 mr-1" /> Clear All
          </Button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border">
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Search</label>
                <Input
                  placeholder="Search pages..."
                  value={filters.search ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Website</label>
                <Input
                  placeholder="Domain..."
                  value={filters.website ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, website: e.target.value || undefined })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Status</label>
                <Select
                  value={filters.status ?? ""}
                  onValueChange={(v) => onFiltersChange({ ...filters, status: v || undefined })}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="All statuses" /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Severity</label>
                <Select
                  value={filters.severity ?? ""}
                  onValueChange={(v) => onFiltersChange({ ...filters, severity: v || undefined })}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="All severities" /></SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Content Type</label>
                <Select
                  value={filters.content_type ?? ""}
                  onValueChange={(v) => onFiltersChange({ ...filters, content_type: v || undefined })}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Schema Type</label>
                <Select
                  value={filters.schema_type ?? ""}
                  onValueChange={(v) => onFiltersChange({ ...filters, schema_type: v || undefined })}
                >
                  <SelectTrigger className="h-9"><SelectValue placeholder="All schema types" /></SelectTrigger>
                  <SelectContent>
                    {SCHEMA_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Date From</label>
                <Input
                  type="date"
                  value={filters.date_from ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, date_from: e.target.value || undefined })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Date To</label>
                <Input
                  type="date"
                  value={filters.date_to ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, date_to: e.target.value || undefined })}
                  className="h-9"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={onApply}>Apply Filters</Button>
              <Button size="sm" className="rounded-xl gradient-primary text-white border-0" onClick={onReset}>Reset</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}