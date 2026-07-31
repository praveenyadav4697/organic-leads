import type { SEOOverview } from "@/modules/onpage-seo/types";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";
import { Target, Award, AlertTriangle, CheckCircle2, XCircle, Eye, TrendingUp, Zap, BookOpen, Image as ImageIcon, Link as LinkIcon, Code, FileText, Brain, Lightbulb, Rocket } from "lucide-react";

interface DashboardCardsProps {
  overview: SEOOverview | undefined;
  isLoading: boolean;
}

export function DashboardCards({ overview, isLoading }: DashboardCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-24 mb-2" />
            <div className="skeleton h-8 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Overall SEO Score" value={overview.overall_score} />
      <KpiCard label="Optimized Pages" value={overview.optimized_pages} />
      <KpiCard label="Pages with Issues" value={overview.pages_with_issues} />
      <KpiCard label="Critical Errors" value={overview.critical_errors} />
      <KpiCard label="Warnings" value={overview.warnings} />
      <KpiCard label="Passed Checks" value={overview.passed_checks} />
      <KpiCard label="Avg Readability" value={overview.avg_readability} />
      <KpiCard label="Missing Meta Tags" value={overview.missing_meta_tags} />
      <KpiCard label="Duplicate Titles" value={overview.duplicate_titles} />
      <KpiCard label="Broken Links" value={overview.broken_links} />
      <KpiCard label="Schema Coverage" value={overview.schema_coverage} />
      <KpiCard label="Answer Readiness" value={overview.answer_readiness_score} />
    </div>
  );
}