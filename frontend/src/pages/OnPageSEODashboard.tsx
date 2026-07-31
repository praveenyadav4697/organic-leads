import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/modules/onpage-seo/components/stat-cards";
import { FiltersPanel } from "@/modules/onpage-seo/components/filters";
import { PagesTable } from "@/modules/onpage-seo/components/pages-table";
import { SEOAuditTab, KeywordsTab, MetaTagsTab, HeadingsTab, ContentTab, ImagesTab, InternalLinksTab, ExternalLinksTab, CanonicalTab, RobotsTab, SitemapTab, SchemaTab, AnswerReadinessTab, AIRecommendationsTab, BulkActionsTab, HistoryTab, LogsTab } from "@/modules/onpage-seo/components/tabs";
import { useSEOOverview, useSEOPages, useRunSEOScan, useVerifyFixes, useBulkOptimize, useApproveChanges, useExportSEOData } from "@/modules/onpage-seo/hooks";
import { F06_NAV } from "@/modules/onpage-seo/constants";
import { Download, RefreshCw, Scan, CheckCircle2, FileText, Settings, Zap } from "lucide-react";
import { toast } from "sonner";
import type { SEOFilters } from "@/modules/onpage-seo/types";

function OverviewTab() {
  return <div className="text-sm text-muted-foreground">Overview content loading...</div>;
}

function PagesTab() {
  return <div className="text-sm text-muted-foreground">Pages content loading...</div>;
}

function SEOTab() {
  return <div className="text-sm text-muted-foreground">SEO Audit content loading...</div>;
}

function KeywordsTab() {
  return <div className="text-sm text-muted-foreground">Keywords content loading...</div>;
}

function MetaTagsTab() {
  return <div className="text-sm text-muted-foreground">Meta Tags content loading...</div>;
}

function HeadingsTab() {
  return <div className="text-sm text-muted-foreground">Headings content loading...</div>;
}

function ContentTab() {
  return <div className="text-sm text-muted-foreground">Content content loading...</div>;
}

function ImagesTab() {
  return <div className="text-sm text-muted-foreground">Images content loading...</div>;
}

function InternalLinksTab() {
  return <div className="text-sm text-muted-foreground">Internal Links content loading...</div>;
}

function ExternalLinksTab() {
  return <div className="text-sm text-muted-foreground">External Links content loading...</div>;
}

function CanonicalTab() {
  return <div className="text-sm text-muted-foreground">Canonical content loading...</div>;
}

function RobotsTab() {
  return <div className="text-sm text-muted-foreground">Robots content loading...</div>;
}

function SitemapTab() {
  return <div className="text-sm text-muted-foreground">Sitemap content loading...</div>;
}

function SchemaTab() {
  return <div className="text-sm text-muted-foreground">Schema content loading...</div>;
}

function AnswerReadinessTab() {
  return <div className="text-sm text-muted-foreground">Answer Readiness content loading...</div>;
}

function AIRecommendationsTab() {
  return <div className="text-sm text-muted-foreground">AI Recommendations content loading...</div>;
}

function BulkActionsTab() {
  return <div className="text-sm text-muted-foreground">Bulk Actions content loading...</div>;
}

function HistoryTab() {
  return <div className="text-sm text-muted-foreground">History content loading...</div>;
}

function LogsTab() {
  return <div className="text-sm text-muted-foreground">Logs content loading...</div>;
}

function SettingsTab() {
  return <div className="text-sm text-muted-foreground">Settings content loading...</div>;
}

export function OnPageSEODashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<SEOFilters>({});
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("seo_score");
  const [sortOrder, setSortOrder] = useState("desc");

  const overview = useSEOOverview(filters);
  const pages = useSEOPages({ page, page_size: 20, sortBy, sortOrder, ...filters });

  const runScan = useRunSEOScan();
  const verifyFixes = useVerifyFixes();
  const bulkOptimize = useBulkOptimize();
  const approveChanges = useApproveChanges();
  const exportData = useExportSEOData();

  const handleExport = (format: string) => {
    exportData.mutate({ pageId: "default", format }, {
      onSuccess: () => toast.success(`Exported as ${format.toUpperCase()}`),
      onError: () => toast.error("Export failed"),
    });
  };

  const handleRunScan = () => {
    runScan.mutate(
      { website_id: "default" },
      {
        onSuccess: () => toast.success("SEO scan started"),
        onError: () => toast.error("SEO scan failed"),
      }
    );
  };

  const handleVerify = () => {
    verifyFixes.mutate("default", {
      onSuccess: () => toast.success("Fix verification completed"),
      onError: () => toast.error("Fix verification failed"),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="F06 · On-Page SEO Engine"
        title="On-Page SEO"
        description="Automate on-page SEO auditing, identify optimization opportunities, and verify fixes with AI-powered recommendations."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} className="flex items-center gap-1" disabled={exportData.isPending}>
              <Download className="size-3" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")} className="flex items-center gap-1" disabled={exportData.isPending}>
              <Download className="size-3" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="flex items-center gap-1" disabled={exportData.isPending}>
              <FileText className="size-3" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifyFixes.isPending} className="flex items-center gap-1">
              <CheckCircle2 className="size-3" /> {verifyFixes.isPending ? "Verifying..." : "Verify Fixes"}
            </Button>
            <Button size="sm" onClick={handleRunScan} disabled={runScan.isPending} className="flex items-center gap-1 gradient-primary text-white border-0">
              <Scan className="size-3" /> {runScan.isPending ? "Scanning..." : "Run SEO Audit"}
            </Button>
          </div>
        }
      />

      <StatCards overview={overview.data} isLoading={overview.isLoading} />

      <FiltersPanel filters={filters} onFiltersChange={setFilters} onApply={() => {}} onReset={() => setFilters({})} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto p-1 bg-muted/50 rounded-2xl">
          {F06_NAV.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="rounded-xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="pages">
          <PagesTable
            pages={pages.data?.items ?? []}
            isLoading={pages.isLoading}
            total={pages.data?.total ?? 0}
            page={page}
            totalPages={pages.data?.total_pages ?? 1}
            onPageChange={setPage}
            onSort={(field) => {
              if (sortBy === field) {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortBy(field);
                setSortOrder("desc");
              }
            }}
            sortBy={sortBy}
            sortOrder={sortOrder}
          />
        </TabsContent>
        <TabsContent value="seo-audit"><SEOTab /></TabsContent>
        <TabsContent value="keywords"><KeywordsTab /></TabsContent>
        <TabsContent value="meta-tags"><MetaTagsTab /></TabsContent>
        <TabsContent value="headings"><HeadingsTab /></TabsContent>
        <TabsContent value="content"><ContentTab /></TabsContent>
        <TabsContent value="images"><ImagesTab /></TabsContent>
        <TabsContent value="internal-links"><InternalLinksTab /></TabsContent>
        <TabsContent value="external-links"><ExternalLinksTab /></TabsContent>
        <TabsContent value="canonical"><CanonicalTab /></TabsContent>
        <TabsContent value="robots"><RobotsTab /></TabsContent>
        <TabsContent value="sitemap"><SitemapTab /></TabsContent>
        <TabsContent value="schema"><SchemaTab /></TabsContent>
        <TabsContent value="answer-readiness"><AnswerReadinessTab /></TabsContent>
        <TabsContent value="ai-recommendations"><AIRecommendationsTab /></TabsContent>
        <TabsContent value="bulk-actions"><BulkActionsTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="logs"><LogsTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute("/_app/onpage-seo/")({
  head: () => ({ meta: [{ title: "On-Page SEO Engine — Nebula" }] }),
  component: OnPageSEODashboard,
});