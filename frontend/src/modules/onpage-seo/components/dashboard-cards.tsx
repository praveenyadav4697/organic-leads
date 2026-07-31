import type { SEOOverview } from "@/modules/onpage-seo/types";
import { KpiCard } from "@/components/kpi-card";
import { Card } from "@/components/ui/card";

interface DashboardCardsProps {
  overview: SEOOverview | undefined;
  isLoading: boolean;
}

const emptySEOOverview: SEOOverview = {
  overall_score: null,
  optimized_pages: 0,
  pages_with_issues: 0,
  critical_errors: 0,
  warnings: 0,
  passed_checks: 0,
  avg_readability: null,
  missing_meta_tags: 0,
  duplicate_titles: 0,
  broken_links: 0,
  schema_coverage: 0,
  answer_readiness_score: 0,
  ai_recommendations_count: 0,
  last_scan: null,
  score_distribution: [],
  issue_severity: [],
  optimization_progress: [],
  readability_trend: [],
  page_performance: [],
};

export function DashboardCards({ overview, isLoading }: DashboardCardsProps) {
  const data = overview ?? emptySEOOverview;

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Overall SEO Score" value={data.overall_score} />
      <KpiCard label="Optimized Pages" value={data.optimized_pages} />
      <KpiCard label="Pages with Issues" value={data.pages_with_issues} />
      <KpiCard label="Critical Errors" value={data.critical_errors} />
      <KpiCard label="Warnings" value={data.warnings} />
      <KpiCard label="Passed Checks" value={data.passed_checks} />
      <KpiCard label="Avg Readability" value={data.avg_readability} />
      <KpiCard label="Missing Meta Tags" value={data.missing_meta_tags} />
      <KpiCard label="Duplicate Titles" value={data.duplicate_titles} />
      <KpiCard label="Broken Links" value={data.broken_links} />
      <KpiCard label="Schema Coverage" value={data.schema_coverage} />
      <KpiCard label="Answer Readiness" value={data.answer_readiness_score} />
    </div>
  );
}
