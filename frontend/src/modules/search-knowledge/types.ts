export interface KnowledgeOverview {
  totalEntities: number;
  indexedTopics: number;
  semanticScore: number;
  searchVisibility: number;
  aiConfidence: number;
  knowledgeCoverage: number;
  missingEntities: number;
  lastScan: string;
  knowledgeGrowth: number;
  topicDistribution: { name: string; count: number }[];
  entityCategories: { name: string; count: number }[];
  keywordIntentDistribution: { intent: string; count: number }[];
  coverageHeatmap: { topic: string; coverage: number }[];
}

export interface Entity {
  id: string;
  name: string;
  type: string;
  entityType: string;
  confidence: number;
  mentions: number;
  source: string;
  status: "active" | "inactive" | "pending" | "error";
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedEntities {
  items: Entity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Topic {
  id: string;
  name: string;
  coverage: number;
  articles: number;
  ranking: number;
  health: "good" | "warning" | "poor";
  priority: "high" | "medium" | "low";
  recommendations: string[];
}

export interface PaginatedTopics {
  items: Topic[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  difficulty: number;
  intent: "informational" | "navigational" | "commercial" | "transactional";
  cpc: number;
  competition: number;
  ranking: number;
  trend: "up" | "down" | "stable";
  status: "indexed" | "not_indexed" | "improving" | "declining";
}

export interface PaginatedKeywords {
  items: Keyword[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface IntentDistribution {
  informational: number;
  navigational: number;
  commercial: number;
  transactional: number;
  questionBased: number;
}

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  authority: number;
  topics: number;
  keywords: number;
  ranking: number;
  overlap: number;
  gapScore: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  impact: string;
  difficulty: "easy" | "moderate" | "hard";
  estimatedTraffic: number;
  action: string;
  status: "pending" | "accepted" | "rejected" | "completed";
}

export interface SearchTrend {
  date: string;
  volume: number;
  growth: number;
}

export interface QuestionItem {
  id: string;
  question: string;
  answer: string;
  topic: string;
  intent: string;
  searchVolume: number;
}

export interface ContentGap {
  id: string;
  keyword: string;
  topic: string;
  opportunityScore: number;
  priority: "critical" | "high" | "medium" | "low";
  currentRanking: number;
  difficulty: number;
  volume: number;
}

export interface ScanLog {
  id: string;
  type: "scan" | "update" | "error" | "warning" | "ai_event";
  message: string;
  timestamp: string;
  details?: string;
}

export interface HistorySnapshot {
  id: string;
  scanDate: string;
  entities: number;
  topics: number;
  keywords: number;
  semanticScore: number;
  visibility: number;
  coverage: number;
}

export interface SearchKnowledgeFilters {
  search?: string;
  website?: string;
  language?: string;
  country?: string;
  searchEngine?: string;
  topic?: string;
  category?: string;
  entityType?: string;
  dateRange?: { from: string; to: string };
  searchIntent?: string;
  status?: string;
}

export interface ScanRequest {
  websiteId?: string;
  language?: string;
  country?: string;
  searchEngine?: string;
  topic?: string;
  category?: string;
  entityType?: string;
}

export interface ScanResponse {
  scanId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  entitiesFound: number;
  topicsFound: number;
}

export interface ExportResponse {
  downloadUrl: string;
  format: "csv" | "xlsx" | "pdf";
  expiresAt: string;
}