import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback";
import { DashboardCards } from "@/modules/search-knowledge/components/dashboard-cards";
import { KnowledgeGraph } from "@/modules/search-knowledge/components/knowledge-graph";
import { EntityTable } from "@/modules/search-knowledge/components/entity-table";
import { TopicsSection } from "@/modules/search-knowledge/components/topics-section";
import { KeywordsTable } from "@/modules/search-knowledge/components/keywords-table";
import { IntentChartSection } from "@/modules/search-knowledge/components/intent-charts";
import { CompetitorsSection } from "@/modules/search-knowledge/components/competitors";
import { RecommendationsSection } from "@/modules/search-knowledge/components/recommendations";
import { SearchTrendsSection } from "@/modules/search-knowledge/components/search-trends";
import { QuestionsSection } from "@/modules/search-knowledge/components/questions";
import { ContentGapsSection } from "@/modules/search-knowledge/components/content-gaps";
import { LogsSection } from "@/modules/search-knowledge/components/logs";
import { HistorySection } from "@/modules/search-knowledge/components/history";
import { FiltersPanel } from "@/modules/search-knowledge/components/filters";
import { useKnowledgeOverview } from "@/modules/search-knowledge/hooks";
import { useEntities } from "@/modules/search-knowledge/hooks";
import { useTopics } from "@/modules/search-knowledge/hooks";
import { useKeywords } from "@/modules/search-knowledge/hooks";
import { useIntent } from "@/modules/search-knowledge/hooks";
import { useCompetitors } from "@/modules/search-knowledge/hooks";
import { useRecommendations } from "@/modules/search-knowledge/hooks";
import { useSearchTrends } from "@/modules/search-knowledge/hooks";
import { useQuestions } from "@/modules/search-knowledge/hooks";
import { useContentGaps } from "@/modules/search-knowledge/hooks";
import { useLogs } from "@/modules/search-knowledge/hooks";
import { useHistory } from "@/modules/search-knowledge/hooks";
import type { SearchKnowledgeFilters } from "@/modules/search-knowledge/types";

export function SearchKnowledgePage() {
  const [filters, setFilters] = useState<SearchKnowledgeFilters>({});
  const [activeTab, setActiveTab] = useState("overview");

  const overview = useKnowledgeOverview(filters);
  const entities = useEntities({ ...filters, page: 1, pageSize: 20 });
  const topics = useTopics({ ...filters, page: 1, pageSize: 20 });
  const keywords = useKeywords({ ...filters, page: 1, pageSize: 20 });
  const intent = useIntent(filters);
  const competitors = useCompetitors(filters);
  const recommendations = useRecommendations();
  const trends = useSearchTrends(filters);
  const questions = useQuestions(filters);
  const gaps = useContentGaps(filters);
  const logs = useLogs({ page: 1, pageSize: 30 });
  const history = useHistory();

  const onApplyFilters = () => {
    setFilters((prev) => ({ ...prev }));
  };

  return (
    <div className="space-y-6">
      <FiltersPanel
        filters={filters}
        onFiltersChange={setFilters}
        onApply={onApplyFilters}
        onReset={() => setFilters({})}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto p-1 bg-muted/50 rounded-2xl">
          {[
            "overview", "knowledge-graph", "entities", "topics", "keywords",
            "intent", "competitors", "recommendations", "search-trends",
            "questions", "content-gaps", "logs", "history"
          ].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-xl text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {tab.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <DashboardCards data={overview.data ?? { totalEntities: 0, indexedTopics: 0, semanticScore: 0, searchVisibility: 0, aiConfidence: 0, knowledgeCoverage: 0, missingEntities: 0, lastScan: "", knowledgeGrowth: 0, topicDistribution: [], entityCategories: [], keywordIntentDistribution: [], coverageHeatmap: [] }} isLoading={overview.isLoading} />
          {overview.data && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <Card className="p-5">
                <div className="text-sm font-semibold mb-3">Coverage Heatmap</div>
                {overview.data.coverageHeatmap.length > 0 ? (
                  <CoverageHeatmap data={overview.data.coverageHeatmap} />
                ) : (
                  <EmptyState
                    title="No coverage data yet"
                    description="Run a discovery scan to populate this section."
                  />
                )}
              </Card>
              <Card className="p-5">
                <div className="text-sm font-semibold mb-3">Knowledge Growth</div>
                {overview.data.topicDistribution.length > 0 ? (
                  <TopicDistributionMini data={overview.data.topicDistribution} />
                ) : (
                  <EmptyState
                    title="No growth data yet"
                    description="Run a discovery scan to populate this section."
                  />
                )}
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="knowledge-graph">
          <KnowledgeGraph entities={entities.data?.items ?? []} />
        </TabsContent>

        <TabsContent value="entities">
          <EntityTable data={entities.data} isLoading={entities.isLoading} search="" onSearchChange={() => {}} />
        </TabsContent>

        <TabsContent value="topics">
          <TopicsSection data={topics.data} isLoading={topics.isLoading} />
        </TabsContent>

        <TabsContent value="keywords">
          <KeywordsTable data={keywords.data} isLoading={keywords.isLoading} search="" onSearchChange={() => {}} />
        </TabsContent>

        <TabsContent value="intent">
          <IntentChartSection data={intent.data} isLoading={intent.isLoading} />
        </TabsContent>

        <TabsContent value="competitors">
          <CompetitorsSection data={competitors.data} isLoading={competitors.isLoading} />
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationsSection data={recommendations.data} isLoading={recommendations.isLoading} />
        </TabsContent>

        <TabsContent value="search-trends">
          <SearchTrendsSection data={trends.data} isLoading={trends.isLoading} />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionsSection data={questions.data} isLoading={questions.isLoading} />
        </TabsContent>

        <TabsContent value="content-gaps">
          <ContentGapsSection data={gaps.data} isLoading={gaps.isLoading} />
        </TabsContent>

        <TabsContent value="logs">
          <LogsSection data={logs.data} isLoading={logs.isLoading} />
        </TabsContent>

        <TabsContent value="history">
          <HistorySection data={history.data} isLoading={history.isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CoverageHeatmap({ data }: { data: { topic: string; coverage: number }[] }) {
  const maxCoverage = Math.max(...data.map((d) => d.coverage), 1);
  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((item) => (
        <div key={item.topic} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-28 truncate">{item.topic}</span>
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${item.coverage >= 80 ? "bg-success" : item.coverage >= 50 ? "bg-warning" : "bg-destructive"}`}
              style={{ width: `${(item.coverage / maxCoverage) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium w-8 text-right">{item.coverage}%</span>
        </div>
      ))}
    </div>
  );
}

function TopicDistributionMini({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-muted-foreground truncate">{item.name}</span>
              <span className="font-medium">{item.count}</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(item.count / total) * 100}%` }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}