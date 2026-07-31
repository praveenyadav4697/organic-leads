import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SearchKnowledgeFilters } from "@/modules/search-knowledge/types";
import { SEARCH_ENGINES, ENTITY_TYPES, SEARCH_INTENTS } from "@/modules/search-knowledge/constants";

interface FiltersPanelProps {
  filters: SearchKnowledgeFilters;
  onFiltersChange: (filters: SearchKnowledgeFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export function FiltersPanel({ filters, onFiltersChange, onApply, onReset }: FiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = <K extends keyof SearchKnowledgeFilters>(key: K, value: SearchKnowledgeFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search entities, topics..."
            value={filters.search ?? ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1">
          <Filter className="size-3" /> Filters
        </Button>
        <Button variant="outline" size="sm" onClick={onReset} className="flex items-center gap-1">
          <X className="size-3" /> Reset
        </Button>
        <Button size="sm" onClick={onApply} className="flex items-center gap-1">
          Apply
        </Button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-2xl border border-border bg-card p-4 space-y-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Website</label>
              <Input placeholder="Filter by website" value={filters.website ?? ""} onChange={(e) => updateFilter("website", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Language</label>
              <Input placeholder="e.g. en" value={filters.language ?? ""} onChange={(e) => updateFilter("language", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Country</label>
              <Input placeholder="e.g. US" value={filters.country ?? ""} onChange={(e) => updateFilter("country", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Search Engine</label>
              <Select value={filters.searchEngine ?? ""} onValueChange={(v) => updateFilter("searchEngine", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All engines" />
                </SelectTrigger>
                <SelectContent>
                  {SEARCH_ENGINES.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Topic</label>
              <Input placeholder="Filter by topic" value={filters.topic ?? ""} onChange={(e) => updateFilter("topic", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Category</label>
              <Input placeholder="Filter by category" value={filters.category ?? ""} onChange={(e) => updateFilter("category", e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Entity Type</label>
              <Select value={filters.entityType ?? ""} onValueChange={(v) => updateFilter("entityType", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">Search Intent</label>
              <Select value={filters.searchIntent ?? ""} onValueChange={(v) => updateFilter("searchIntent", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="All intents" />
                </SelectTrigger>
                <SelectContent>
                  {SEARCH_INTENTS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">From</label>
              <Input type="date" value={filters.dateRange?.from ?? ""} onChange={(e) => updateFilter("dateRange", { ...(filters.dateRange ?? { from: "", to: "" }), from: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">To</label>
              <Input type="date" value={filters.dateRange?.to ?? ""} onChange={(e) => updateFilter("dateRange", { ...(filters.dateRange ?? { from: "", to: "" }), to: e.target.value })} className="rounded-xl" />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}