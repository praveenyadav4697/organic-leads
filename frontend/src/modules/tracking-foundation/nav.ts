import {
  Gauge,
  Monitor,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  RefreshCw,
  Download,
  Search,
  Filter,
  Eye,
  Copy,
  Play,
  Clock,
  FileText,
  Settings,
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Link,
  Bug,
  AlertCircle,
  Info,
  Trash2,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

export interface SubNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export const trackingFoundationNav: SubNavItem[] = [
  { to: "/tracking-foundation/", label: "Overview", icon: Gauge },
  { to: "/tracking-foundation/tracking", label: "Tracking", icon: Monitor },
  { to: "/tracking-foundation/forms", label: "Forms", icon: FileText },
  { to: "/tracking-foundation/consent", label: "Consent", icon: ShieldCheck },
  { to: "/tracking-foundation/validation", label: "Validation", icon: CheckCircle2 },
  { to: "/tracking-foundation/verification", label: "Verification", icon: Activity },
  { to: "/tracking-foundation/routing", label: "Routing", icon: Link },
  { to: "/tracking-foundation/events", label: "Events", icon: Play },
  { to: "/tracking-foundation/submissions", label: "Submissions", icon: Mail },
  { to: "/tracking-foundation/measurement-plan", label: "Measurement Plan", icon: BarChart3 },
];

export const statusColors: Record<string, string> = {
  healthy: "bg-success/10 text-success border-success/20",
  degraded: "bg-warning/10 text-warning-foreground border-warning/30",
  unhealthy: "bg-destructive/10 text-destructive border-destructive/20",
  unknown: "bg-muted text-muted-foreground border-border",
  active: "bg-success/10 text-success border-success/20",
  inactive: "bg-muted text-muted-foreground border-border",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  pending: "bg-warning/10 text-warning-foreground border-warning/30",
  verified: "bg-success/10 text-success border-success/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning-foreground border-warning/30",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  customized: "bg-info/10 text-info border-info/20",
  delivered: "bg-success/10 text-success border-success/20",
  sent: "bg-info/10 text-info border-info/20",
  retrying: "bg-warning/10 text-warning-foreground border-warning/30",
  completed: "bg-success/10 text-success border-success/20",
  running: "bg-info/10 text-info border-info/20",
  queued: "bg-muted text-muted-foreground border-border",
};

export function getStatusColor(status: string): string {
  return statusColors[status] ?? "bg-muted text-muted-foreground border-border";
}