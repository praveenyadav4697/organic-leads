import type { BusinessKeywordCompetitorFilters, KeywordIntent, KeywordPriority } from "@/modules/business-keyword-competitor/types";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Globe, Building2, MapPin, Languages, Factory, Hash, Compass, ShieldCheck,
  TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Calendar,
} from "lucide-react";

interface FiltersPanelProps {
  filters: BusinessKeywordCompetitorFilters;
  onFiltersChange: (filters: BusinessKeywordCompetitorFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

const INTENT_OPTIONS: { value: KeywordIntent; label: string }[] = [
  { value: "informational", label: "Informational" },
  { value: "navigational", label: "Navigational" },
  { value: "commercial", label: "Commercial" },
  { value: "transactional", label: "Transactional" },
  { value: "local", label: "Local" },
  { value: "branded", label: "Branded" },
  { value: "question", label: "Question" },
];

const PRIORITY_OPTIONS: { value: KeywordPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const DIFFICULTY_OPTIONS = ["easy", "medium", "hard"];
const COMPETITION_OPTIONS = ["low", "medium", "high"];

export function FiltersPanel({ filters, onFiltersChange, onApply, onReset }: FiltersPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hasActiveFilters =
    !!filters.search ||
    !!filters.website ||
    !!filters.business ||
    !!filters.country ||
    !!filters.city ||
    !!filters.language ||
    !!filters.industry ||
    !!filters.intent ||
    !!filters.competition ||
    !!filters.difficulty ||
    !!filters.priority ||
    !!filters.competitor ||
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
                  placeholder="Search keywords..."
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
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Country</label>
                <Input
                  placeholder="Country..."
                  value={filters.country ?? ""}
                  onChange={(e) => onFiltersChange({ ...filters, country: e.target.value || undefined })}
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Intent</label>
                <Select
                  value={filters.intent ?? ""}
                  onValueChange={(v) => onFiltersChange({ ...filters, intent: v as KeywordIntent || undefined })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All intents" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Competition</label>
                <Select
                  value={filters.competition ?? ""}
                  onValueChange={(v) => onFiltersChange({ ...filters, competition: v || undefined })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPETITION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Difficulty</label>
                <Select
                  value={filters.difficulty ?? ""}
                  onValueChange={(v) => onFiltersChange({ ...filters, difficulty: v || undefined })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-widest text-muted-foreground">Priority</label>
                <Select
                  value={filters.priority ?? ""}
                  onValueChange={(v) => onFiltersChange({ ...filters, priority: v as KeywordPriority || undefined })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={onApply}>
                Apply Filters
              </Button>
              <Button size="sm" className="rounded-xl gradient-primary text-white border-0" onClick={onReset}>
                Reset
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}