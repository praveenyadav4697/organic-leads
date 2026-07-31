import type { SEContent, SEImage, SEInternalLink, SEExternalLink, SECanonical, SERobots, SESitemap, SESchema, SEAnswerReadiness, SERecommendation, SEOHistoryEntry, SEOLogsEntry } from "@/modules/onpage-seo/types";
export { SEOAuditTab } from "./seo-audit";
export { KeywordsTab } from "./keywords-tab";
export { MetaTagsTab } from "./meta-tags";
export { HeadingsTab } from "./headings";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image, Link, Link2, Globe, ShieldCheck, Server, Database, HelpCircle, Brain, Zap, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { STATUS_COLORS } from "@/modules/onpage-seo/constants";

interface ContentTabProps {
  content: SEContent | null;
  isLoading: boolean;
}

export function ContentTab({ content, isLoading }: ContentTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (!content) return <Card className="p-8 text-center"><FileText className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No content data.</p></Card>;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-3"><div className="text-xs text-muted-foreground">Word Count</div><div className="text-lg font-semibold">{content.word_count ?? "—"}</div></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Paragraphs</div><div className="text-lg font-semibold">{content.paragraph_count ?? "—"}</div></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Readability</div><div className="text-lg font-semibold">{content.readability_score ?? "—"}</div></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Grade</div><div className="text-lg font-semibold">{content.readability_grade ?? "—"}</div></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Duplicate Content</div><Badge variant="outline" className={content.has_duplicate_content ? STATUS_COLORS.failed : STATUS_COLORS.passed}>{content.has_duplicate_content ? "Yes" : "No"}</Badge></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Thin Content</div><Badge variant="outline" className={content.has_thin_content ? STATUS_COLORS.warning : STATUS_COLORS.passed}>{content.has_thin_content ? "Yes" : "No"}</Badge></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Content Freshness</div><div className="text-lg font-semibold">{content.content_freshness_days ?? "—"} days</div></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Grammar Issues</div><div className="text-lg font-semibold">{content.grammar_issues ?? "—"}</div></Card>
    </div>
  );
}

interface ImagesTabProps {
  images: SEImage[];
  isLoading: boolean;
}

export function ImagesTab({ images, isLoading }: ImagesTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (images.length === 0) {
    return <Card className="p-8 text-center"><Image className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No image data.</p></Card>;
  }
  return (
    <div className="space-y-2">
      {images.map((img) => (
        <Card key={img.id} className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono truncate max-w-[300px]">{img.src}</div>
          <div className="flex items-center gap-2">
            {!img.has_alt && <Badge variant="outline" className={STATUS_COLORS.failed}>Missing Alt</Badge>}
            {img.file_size_kb && <Badge variant="outline">{img.file_size_kb} KB</Badge>}
            {img.uses_lazy_loading && <Badge variant="outline" className="bg-success/10 text-success">Lazy</Badge>}
          </div>
        </Card>
      ))}
    </div>
  );
}

interface InternalLinksTabProps {
  links: SEInternalLink[];
  isLoading: boolean;
}

export function InternalLinksTab({ links, isLoading }: InternalLinksTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (links.length === 0) {
    return <Card className="p-8 text-center"><Link className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No internal link data.</p></Card>;
  }
  return (
    <div className="space-y-2">
      {links.map((link) => (
        <Card key={link.id} className="p-3 flex items-center justify-between">
          <div className="text-xs font-mono truncate max-w-[300px]">{link.target_url}</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{link.anchor_text || "—"}</Badge>
            {link.is_broken && <Badge variant="outline" className={STATUS_COLORS.failed}>Broken</Badge>}
          </div>
        </Card>
      ))}
    </div>
  );
}

interface ExternalLinksTabProps {
  links: SEExternalLink[];
  isLoading: boolean;
}

export function ExternalLinksTab({ links, isLoading }: ExternalLinksTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (links.length === 0) {
    return <Card className="p-8 text-center"><Link2 className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No external link data.</p></Card>;
  }
  return (
    <div className="space-y-2">
      {links.map((link) => (
        <Card key={link.id} className="p-3 flex items-center justify-between">
          <div className="text-xs font-mono truncate max-w-[300px]">{link.target_url}</div>
          <div className="flex items-center gap-2">
            {link.is_nofollow && <Badge variant="outline" className="text-xs">Nofollow</Badge>}
            {link.is_sponsored && <Badge variant="outline" className="text-xs">Sponsored</Badge>}
            {link.is_ugc && <Badge variant="outline" className="text-xs">UGC</Badge>}
            {link.is_broken && <Badge variant="outline" className={STATUS_COLORS.failed}>Broken</Badge>}
          </div>
        </Card>
      ))}
    </div>
  );
}

interface CanonicalTabProps {
  canonical: SECanonical | null;
  isLoading: boolean;
}

export function CanonicalTab({ canonical, isLoading }: CanonicalTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (!canonical) {
    return <Card className="p-8 text-center"><Globe className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No canonical data.</p></Card>;
  }
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Canonical URL</span>
        <Badge variant="outline" className={canonical.is_present ? STATUS_COLORS.passed : STATUS_COLORS.failed}>{canonical.is_present ? "Present" : "Missing"}</Badge>
      </div>
      <div className="text-xs font-mono text-muted-foreground">{canonical.canonical_url ?? "—"}</div>
      {canonical.is_duplicate && <Badge variant="outline" className="mt-2 bg-warning/15 text-warning-foreground">Duplicate</Badge>}
    </Card>
  );
}

interface RobotsTabProps {
  robots: SERobots | null;
  isLoading: boolean;
}

export function RobotsTab({ robots, isLoading }: RobotsTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (!robots) {
    return <Card className="p-8 text-center"><ShieldCheck className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No robots data.</p></Card>;
  }
  return (
    <div className="space-y-3">
      <Card className="p-3"><div className="text-xs text-muted-foreground">Robots.txt</div><Badge variant="outline" className={robots.robots_txt_present ? STATUS_COLORS.passed : STATUS_COLORS.failed}>{robots.robots_txt_present ? "Present" : "Missing"}</Badge></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Robots Meta</div><span className="text-sm font-medium">{robots.robots_meta ?? "—"}</span></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Noindex</div><Badge variant="outline" className={robots.is_noindex ? STATUS_COLORS.warning : STATUS_COLORS.passed}>{robots.is_noindex ? "Yes" : "No"}</Badge></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Nofollow</div><Badge variant="outline" className={robots.is_nofollow ? STATUS_COLORS.warning : STATUS_COLORS.passed}>{robots.is_nofollow ? "Yes" : "No"}</Badge></Card>
      {robots.blocked_resources.length > 0 && (
        <Card className="p-3">
          <div className="text-xs text-muted-foreground mb-1">Blocked Resources</div>
          <div className="space-y-1">
            {robots.blocked_resources.map((r, i) => (
              <div key={i} className="text-xs font-mono">{r}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

interface SitemapTabProps {
  sitemap: SESitemap | null;
  isLoading: boolean;
}

export function SitemapTab({ sitemap, isLoading }: SitemapTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (!sitemap) {
    return <Card className="p-8 text-center"><Server className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No sitemap data.</p></Card>;
  }
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">XML Sitemap</span>
        <Badge variant="outline" className={sitemap.is_present ? STATUS_COLORS.passed : STATUS_COLORS.failed}>{sitemap.is_present ? "Present" : "Missing"}</Badge>
      </div>
      <div className="text-xs text-muted-foreground">Page in Sitemap: {sitemap.page_in_sitemap ? "Yes" : "No"}</div>
      <div className="text-xs text-muted-foreground">Submission: {sitemap.submission_status}</div>
      {sitemap.sitemap_url && <div className="text-xs font-mono text-muted-foreground mt-1">{sitemap.sitemap_url}</div>}
    </Card>
  );
}

interface SchemaTabProps {
  schemas: SESchema[];
  isLoading: boolean;
}

export function SchemaTab({ schemas, isLoading }: SchemaTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (schemas.length === 0) {
    return <Card className="p-8 text-center"><Database className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No schema data.</p></Card>;
  }
  return (
    <div className="space-y-2">
      {schemas.map((s) => (
        <Card key={s.id} className="p-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{s.schema_type}</Badge>
            <Badge variant="outline" className={s.is_valid ? STATUS_COLORS.passed : STATUS_COLORS.failed}>{s.is_valid ? "Valid" : "Invalid"}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">Errors: {s.error_count} | Warnings: {s.warning_count}</div>
          {s.errors.length > 0 && (
            <div className="mt-1 space-y-1">
              {s.errors.map((e, i) => (
                <div key={i} className="text-xs text-destructive">{e}</div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

interface AnswerReadinessTabProps {
  data: SEAnswerReadiness | null;
  isLoading: boolean;
}

export function AnswerReadinessTab({ data, isLoading }: AnswerReadinessTabProps) {
  if (isLoading) {
    return <Card className="p-4"><div className="skeleton h-4 w-48 mb-2" /><div className="skeleton h-3 w-full" /></Card>;
  }
  if (!data) {
    return <Card className="p-8 text-center"><HelpCircle className="size-10 text-muted-foreground mx-auto mb-3" /><p className="text-sm text-muted-foreground">No answer readiness data.</p></Card>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-3"><div className="text-xs text-muted-foreground">Featured Snippet Ready</div><Badge variant="outline" className={data.is_featured_snippet_ready ? STATUS_COLORS.passed : STATUS_COLORS.warning}>{data.is_featured_snippet_ready ? "Yes" : "No"}</Badge></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">FAQ Optimized</div><Badge variant="outline" className={data.faq_optimized ? STATUS_COLORS.passed : STATUS_COLORS.warning}>{data.faq_optimized ? "Yes" : "No"}</Badge></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">AI Search Readiness</div><div className="text-lg font-semibold">{data.ai_search_readiness_score ?? "—"}</div></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Voice Search</div><Badge variant="outline" className={data.voice_search_optimized ? STATUS_COLORS.passed : STATUS_COLORS.warning}>{data.voice_search_optimized ? "Yes" : "No"}</Badge></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Questions Covered</div><div className="text-lg font-semibold">{data.question_coverage_count}</div></Card>
      <Card className="p-3"><div className="text-xs text-muted-foreground">Structured Answers</div><Badge variant="outline" className={data.has_structured_answers ? STATUS_COLORS.passed : STATUS_COLORS.warning}>{data.has_structured_answers ? "Yes" : "No"}</Badge></Card>
    </div>
  );
}

interface AIRecommendationsTabProps {
  recommendations: SERecommendation[];
  isLoading: boolean;
}

export function AIRecommendationsTab({ recommendations, isLoading }: AIRecommendationsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-48 mb-2" />
            <div className="skeleton h-3 w-full mb-1" />
            <div className="skeleton h-3 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Brain className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No recommendations yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Run an SEO scan to generate AI recommendations.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <Card key={rec.id} className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="text-sm font-semibold">{rec.title}</div>
            <Badge variant="outline" className={STATUS_COLORS[rec.priority]}>{rec.priority}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{rec.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div><span className="text-muted-foreground">Impact:</span> <span className="font-medium">{rec.impact}</span></div>
            <div><span className="text-muted-foreground">Est. Traffic Gain:</span> <span className="font-medium">{rec.estimated_traffic_gain ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Est. Ranking Improvement:</span> <span className="font-medium">{rec.estimated_ranking_improvement ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Difficulty:</span> <span className="font-medium">{rec.difficulty}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={STATUS_COLORS[rec.status]}>{rec.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface BulkActionsTabProps {
  isLoading: boolean;
  onBulkOptimize?: (action: string) => void;
}

export function BulkActionsTab({ isLoading, onBulkOptimize }: BulkActionsTabProps) {
  return (
    <div className="space-y-3">
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Bulk Meta Update</div>
        <p className="text-xs text-muted-foreground mb-3">Update meta titles and descriptions across multiple pages.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => onBulkOptimize?.("update_meta")} disabled={isLoading}>
          {isLoading ? "Processing..." : "Start Bulk Meta Update"}
        </Button>
      </Card>
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Bulk Image Optimization</div>
        <p className="text-xs text-muted-foreground mb-3">Optimize images across selected pages.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => onBulkOptimize?.("optimize_images")} disabled={isLoading}>
          {isLoading ? "Processing..." : "Start Bulk Image Optimization"}
        </Button>
      </Card>
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Bulk Schema Update</div>
        <p className="text-xs text-muted-foreground mb-3">Update structured data across selected pages.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => onBulkOptimize?.("update_schema")} disabled={isLoading}>
          {isLoading ? "Processing..." : "Start Bulk Schema Update"}
        </Button>
      </Card>
      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">Bulk Canonical Update</div>
        <p className="text-xs text-muted-foreground mb-3">Update canonical URLs across selected pages.</p>
        <Button variant="outline" className="rounded-xl" onClick={() => onBulkOptimize?.("update_canonical")} disabled={isLoading}>
          {isLoading ? "Processing..." : "Start Bulk Canonical Update"}
        </Button>
      </Card>
    </div>
  );
}

interface HistoryTabProps {
  history: SEOHistoryEntry[];
  isLoading: boolean;
}

export function HistoryTab({ history, isLoading }: HistoryTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-48 mb-2" />
            <div className="skeleton h-3 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No audit history.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <Card key={entry.id} className="p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{entry.scan_type}</div>
            <div className="text-xs text-muted-foreground">{entry.status} • {entry.findings_count} findings</div>
          </div>
          <div className="text-xs text-muted-foreground">{entry.started_at ? new Date(entry.started_at).toLocaleString() : "—"}</div>
        </Card>
      ))}
    </div>
  );
}

interface LogsTabProps {
  logs: SEOLogsEntry[];
  isLoading: boolean;
}

export function LogsTab({ logs, isLoading }: LogsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-3">
            <div className="skeleton h-3 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="size-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No logs available.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <Card key={log.id} className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={STATUS_COLORS[log.type as keyof typeof STATUS_COLORS] ?? ""}>{log.type}</Badge>
            <span className="text-xs text-muted-foreground">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}</span>
          </div>
          <div className="text-xs">{log.message}</div>
          {log.details && <div className="text-xs text-muted-foreground mt-1 font-mono">{log.details}</div>}
          <div className="text-xs text-muted-foreground mt-1">Correlation: {log.correlation_id}</div>
        </Card>
      ))}
    </div>
  );
}