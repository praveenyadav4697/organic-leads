import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  TrendingUp,
  Eye,
  Clock,
  Target,
  AlertTriangle,
  Activity,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  FileText,
  ImageIcon,
  Film,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Zap,
  MapPin,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const SEARCH_KNOWLEDGE_NAV = [
  { label: "Overview", value: "overview", icon: Activity },
  { label: "Knowledge Graph", value: "knowledge-graph", icon: Brain },
  { label: "Entities", value: "entities", icon: Target },
  { label: "Topics", value: "topics", icon: BookOpen },
  { label: "Keywords", value: "keywords", icon: Search },
  { label: "Intent", value: "intent", icon: Compass },
  { label: "Competitors", value: "competitors", icon: ShieldCheck },
  { label: "Recommendations", value: "recommendations", icon: Sparkles },
  { label: "Search Trends", value: "search-trends", icon: TrendingUp },
  { label: "Questions", value: "questions", icon: Zap },
  { label: "Content Gaps", value: "content-gaps", icon: AlertTriangle },
  { label: "Logs", value: "logs", icon: Clock },
  { label: "History", value: "history", icon: FileText },
] as const;

export const INTENT_COLORS = {
  informational: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  navigational: "bg-green-500/10 text-green-500 border-green-500/20",
  commercial: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  transactional: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  questionBased: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

export const STATUS_COLORS = {
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 text-warning-foreground border-warning/30",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  indexed: "bg-success/10 text-success border-success/20",
  not_indexed: "bg-destructive/10 text-destructive border-destructive/20",
  improving: "bg-success/10 text-success border-success/20",
  declining: "bg-destructive/10 text-destructive border-destructive/20",
  good: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/15 text-warning-foreground border-warning/30",
  poor: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-warning/15 text-warning-foreground border-warning/30",
  medium: "bg-muted text-muted-foreground border-border",
  low: "bg-muted text-muted-foreground border-border",
};

export const HEALTH_COLORS = {
  good: { bg: "bg-success/10 text-success", label: "Good" },
  warning: { bg: "bg-warning/15 text-warning-foreground", label: "Warning" },
  poor: { bg: "bg-destructive/10 text-destructive", label: "Poor" },
};

export const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export const SEARCH_ENGINES = ["Google", "Bing", "DuckDuckGo", "Yahoo", "Baidu"] as const;

export const ENTITY_TYPES = [
  "Organization",
  "Person",
  "Product",
  "Event",
  "Place",
  "Concept",
  "Website",
  "SoftwareApplication",
  "Article",
  "VideoObject",
  "ImageObject",
  "Service",
] as const;

export const SEARCH_INTENTS = [
  "informational",
  "navigational",
  "commercial",
  "transactional",
] as const;

export const EXPORT_FORMATS = ["csv", "xlsx", "pdf"] as const;

export const ARROW_UP = ArrowUpRight;
export const ARROW_DOWN = ArrowDownRight;
export const ARROW_FLAT = Minus;