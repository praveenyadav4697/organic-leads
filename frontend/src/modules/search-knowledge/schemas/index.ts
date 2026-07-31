import { z } from "zod";

export const searchKnowledgeFiltersSchema = z.object({
  website: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  searchEngine: z.string().optional(),
  topic: z.string().optional(),
  category: z.string().optional(),
  entityType: z.string().optional(),
  searchIntent: z.string().optional(),
  status: z.string().optional(),
  dateRange: z
    .object({
      from: z.string().optional(),
      to: z.string().optional(),
    })
    .optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
});

export const scanRequestSchema = z.object({
  websiteId: z.string().optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  searchEngine: z.string().optional(),
  topic: z.string().optional(),
  category: z.string().optional(),
  entityType: z.string().optional(),
});

export const entitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  entityType: z.string(),
  confidence: z.number().min(0).max(1),
  mentions: z.number().min(0),
  source: z.string(),
  status: z.enum(["active", "inactive", "pending", "error"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const topicSchema = z.object({
  id: z.string(),
  name: z.string(),
  coverage: z.number().min(0).max(100),
  articles: z.number().min(0),
  ranking: z.number().min(0),
  health: z.enum(["good", "warning", "poor"]),
  priority: z.enum(["high", "medium", "low"]),
  recommendations: z.array(z.string()),
});

export const keywordSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  volume: z.number().min(0),
  difficulty: z.number().min(0).max(100),
  intent: z.enum(["informational", "navigational", "commercial", "transactional"]),
  cpc: z.number().min(0),
  competition: z.number().min(0).max(1),
  ranking: z.number().min(0),
  trend: z.enum(["up", "down", "stable"]),
  status: z.enum(["indexed", "not_indexed", "improving", "declining"]),
});

export const recommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  impact: z.string(),
  difficulty: z.enum(["easy", "moderate", "hard"]),
  estimatedTraffic: z.number().min(0),
  action: z.string(),
  status: z.enum(["pending", "accepted", "rejected", "completed"]),
});

export const contentGapSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  topic: z.string(),
  opportunityScore: z.number().min(0).max(100),
  priority: z.enum(["critical", "high", "medium", "low"]),
  currentRanking: z.number().min(0),
  difficulty: z.number().min(0).max(100),
  volume: z.number().min(0),
});

export const searchTrendSchema = z.object({
  date: z.string(),
  volume: z.number().min(0),
  growth: z.number(),
});

export const questionItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  topic: z.string(),
  intent: z.string(),
  searchVolume: z.number().min(0),
});

export const competitorSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  authority: z.number().min(0).max(100),
  topics: z.number().min(0),
  keywords: z.number().min(0),
  ranking: z.number().min(0),
  overlap: z.number().min(0).max(100),
  gapScore: z.number().min(0).max(100),
});

export const scanLogSchema = z.object({
  id: z.string(),
  type: z.enum(["scan", "update", "error", "warning", "ai_event"]),
  message: z.string(),
  timestamp: z.string(),
  details: z.string().optional(),
});

export const historySnapshotSchema = z.object({
  id: z.string(),
  scanDate: z.string(),
  entities: z.number().min(0),
  topics: z.number().min(0),
  keywords: z.number().min(0),
  semanticScore: z.number().min(0).max(100),
  visibility: z.number().min(0).max(100),
  coverage: z.number().min(0).max(100),
});

export const knowledgeOverviewSchema = z.object({
  totalEntities: z.number().min(0),
  indexedTopics: z.number().min(0),
  semanticScore: z.number().min(0).max(100),
  searchVisibility: z.number().min(0).max(100),
  aiConfidence: z.number().min(0).max(100),
  knowledgeCoverage: z.number().min(0).max(100),
  missingEntities: z.number().min(0),
  lastScan: z.string(),
  knowledgeGrowth: z.number(),
  topicDistribution: z.array(z.object({ name: z.string(), count: z.number() })),
  entityCategories: z.array(z.object({ name: z.string(), count: z.number() })),
  keywordIntentDistribution: z.array(z.object({ intent: z.string(), count: z.number() })),
  coverageHeatmap: z.array(z.object({ topic: z.string(), coverage: z.number() })),
});

export type SearchKnowledgeFilters = z.infer<typeof searchKnowledgeFiltersSchema>;
export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type Entity = z.infer<typeof entitySchema>;
export type Topic = z.infer<typeof topicSchema>;
export type Keyword = z.infer<typeof keywordSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type ContentGap = z.infer<typeof contentGapSchema>;
export type SearchTrend = z.infer<typeof searchTrendSchema>;
export type QuestionItem = z.infer<typeof questionItemSchema>;
export type Competitor = z.infer<typeof competitorSchema>;
export type ScanLog = z.infer<typeof scanLogSchema>;
export type HistorySnapshot = z.infer<typeof historySnapshotSchema>;
export type KnowledgeOverview = z.infer<typeof knowledgeOverviewSchema>;