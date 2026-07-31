import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatCards } from "@/modules/business-keyword-competitor/components/stat-cards";
import { FiltersPanel } from "@/modules/business-keyword-competitor/components/filters";
import { KeywordsTable } from "@/modules/business-keyword-competitor/components/keywords-table";
import { CompetitorsSection } from "@/modules/business-keyword-competitor/components/competitors-section";
import { AIRecommendations } from "@/modules/business-keyword-competitor/components/ai-recommendations";
import { KeywordGrowthChart, RankingDistributionChart, CompetitionDistributionChart, IntentDistributionChart, MarketShareChart } from "@/modules/business-keyword-competitor/components/charts";
import { useBusinessOverview, useKeywords, useCompetitors, useKeywordOpportunities, useRecommendations, useResearchHistory, useRunResearch, useExportData, useApproveResults } from "@/modules/business-keyword-competitor/hooks";
import { F05_NAV } from "@/modules/business-keyword-competitor/constants";
import { Download, RefreshCw, Plus, Trash2, Sparkles, FileText, Table2, PieChart, BarChart3, LineChart, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import type { BusinessKeywordCompetitorFilters } from "@/modules/business-keyword-competitor/types";

function OverviewTab() {
  return <div className="text-sm text-muted-foreground">Overview content loading...</div>;
}

function BusinessProfileTab() {
  return <div className="text-sm text-muted-foreground">Business Profile content loading...</div>;
}

function KeywordUniverseTab() {
  return <div className="text-sm text-muted-foreground">Keyword Universe content loading...</div>;
}

function KeywordClustersTab() {
  return <div className="text-sm text-muted-foreground">Keyword Clusters content loading...</div>;
}

function KeywordOpportunitiesTab() {
  return <div className="text-sm text-muted-foreground">Keyword Opportunities content loading...</div>;
}

function SearchIntentTab() {
  return <div className="text-sm text-muted-foreground">Search Intent content loading...</div>;
}

function CompetitorsTab() {
  return <div className="text-sm text-muted-foreground">Competitors content loading...</div>;
}

function RankingAnalysisTab() {
  return <div className="text-sm text-muted-foreground">Ranking Analysis content loading...</div>;
}

function SERPAnalysisTab() {
  return <div className="text-sm text-muted-foreground">SERP Analysis content loading...</div>;
}

function TopicClustersTab() {
  return <div className="text-sm text-muted-foreground">Topic Clusters content loading...</div>;
}

function ContentGapsTab() {
  return <div className="text-sm text-muted-foreground">Content Gaps content loading...</div>;
}

function SearchTrendsTab() {
  return <div className="text-sm text-muted-foreground">Search Trends content loading...</div>;
}

function AIRecommendationsTab() {
  return <div className="text-sm text-muted-foreground">AI Recommendations content loading...</div>;
}

function ReportsTab() {
  return <div className="text-sm text-muted-foreground">Reports content loading...</div>;
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

export function BusinessKeywordCompetitorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [filters, setFilters] = useState<BusinessKeywordCompetitorFilters>({});
  const [keywordPage, setKeywordPage] = useState(1);
  const [competitorPage, setCompetitorPage] = useState(1);
  const [opportunityPage, setOpportunityPage] = useState(1);
  const [keywordSortBy, setKeywordSortBy] = useState("keyword_text");
  const [keywordSortOrder, setKeywordSortOrder] = useState("desc");

  const overview = useBusinessOverview(filters);
  const keywords = useKeywords("default-profile", { page: keywordPage, page_size: 20, sortBy: keywordSortBy, sortOrder: keywordSortOrder, search: filters.search });
  const competitors = useCompetitors("default-profile", { page: competitorPage, page_size: 10 });
  const opportunities = useKeywordOpportunities("default-profile", { page: opportunityPage, page_size: 10 });
  const recommendations = useRecommendations("default-profile");
  const history = useResearchHistory("default-profile");

  const runResearch = useRunResearch();
  const exportData = useExportData();
  const approveResults = useApproveResults();

  const handleExport = (format: string) => {
    exportData.mutate({ profileId: "default-profile", format }, {
      onSuccess: () => toast.success(`Exported as ${format.toUpperCase()}`),
      onError: () => toast.error("Export failed"),
    });
  };

  const handleRunResearch = () => {
    runResearch.mutate(
      { business_profile_id: "default-profile" },
      {
        onSuccess: () => toast.success("Research scan started"),
        onError: () => toast.error("Research scan failed"),
      }
    );
  };

  const handleApprove = (action: string) => {
    approveResults.mutate(
      { profileId: "default-profile", data: { items: [], action } },
      {
        onSuccess: () => toast.success(`Results ${action}d successfully`),
        onError: () => toast.error("Approval failed"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="F05 · Business, Keyword & Competitor Intelligence"
        title="Business Intelligence"
        description="Transform business context, customer language, competitor intelligence, and keyword research into a prioritized demand generation strategy."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("csv")} className="flex items-center gap-1" disabled={exportData.isPending}>
              <Download className="size-3" /> {exportData.isPending ? "Exporting..." : "CSV"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")} className="flex items-center gap-1" disabled={exportData.isPending}>
              <Download className="size-3" /> {exportData.isPending ? "Exporting..." : "Excel"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} className="flex items-center gap-1" disabled={exportData.isPending}>
              <FileText className="size-3" /> {exportData.isPending ? "Exporting..." : "PDF"}
            </Button>
            <Button size="sm" onClick={handleRunResearch} disabled={runResearch.isPending} className="flex items-center gap-1 gradient-primary text-white border-0">
              <Sparkles className="size-3" /> {runResearch.isPending ? "Running..." : "Run Research"}
            </Button>
          </div>
        }
      />

      <StatCards overview={overview.data} isLoading={overview.isLoading} />

      <FiltersPanel filters={filters} onFiltersChange={setFilters} onApply={() => {}} onReset={() => setFilters({})} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto p-1 bg-muted/50 rounded-2xl">
          {F05_NAV.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="rounded-xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="business-profile"><BusinessProfileTab /></TabsContent>
        <TabsContent value="keyword-universe">
          <KeywordsTable
            keywords={keywords.data?.items ?? []}
            isLoading={keywords.isLoading}
            total={keywords.data?.total ?? 0}
            page={keywordPage}
            totalPages={keywords.data?.total_pages ?? 1}
            onPageChange={setKeywordPage}
            onSort={(field) => {
              if (keywordSortBy === field) {
                setKeywordSortOrder(keywordSortOrder === "asc" ? "desc" : "asc");
              } else {
                setKeywordSortBy(field);
                setKeywordSortOrder("desc");
              }
            }}
            sortBy={keywordSortBy}
            sortOrder={keywordSortOrder}
          />
        </TabsContent>
        <TabsContent value="keyword-clusters"><KeywordClustersTab /></TabsContent>
        <TabsContent value="keyword-opportunities"><KeywordOpportunitiesTab /></TabsContent>
        <TabsContent value="search-intent"><SearchIntentTab /></TabsContent>
        <TabsContent value="competitors">
          <CompetitorsSection
            competitors={competitors.data?.items ?? []}
            isLoading={competitors.isLoading}
          />
        </TabsContent>
        <TabsContent value="ranking-analysis"><RankingAnalysisTab /></TabsContent>
        <TabsContent value="serp-analysis"><SERPAnalysisTab /></TabsContent>
        <TabsContent value="topic-clusters"><TopicClustersTab /></TabsContent>
        <TabsContent value="content-gaps"><ContentGapsTab /></TabsContent>
        <TabsContent value="search-trends"><SearchTrendsTab /></TabsContent>
        <TabsContent value="ai-recommendations">
          <AIRecommendations
            recommendations={recommendations.data ?? []}
            isLoading={recommendations.isLoading}
          />
        </TabsContent>
        <TabsContent value="reports"><ReportsTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="logs"><LogsTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute("/_app/business-keyword-competitor/")({
  head: () => ({ meta: [{ title: "Business, Keyword & Competitor Intelligence — Nebula" }] }),
  component: BusinessKeywordCompetitorDashboard,
});