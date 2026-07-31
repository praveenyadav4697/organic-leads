export interface BusinessProfile {
  id: string;
  business_name: string;
  primary_domain: string;
  business_type: string | null;
  website_url: string | null;
  description: string | null;
  country: string;
  city: string | null;
  language: string | null;
  industry: string | null;
  products: string[];
  services: string[];
  target_locations: string[];
  customer_personas: string[];
  seed_keywords: string[];
  competitor_domains: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfileCreate {
  business_name: string;
  primary_domain: string;
  business_type: string | null;
  website_url: string | null;
  description: string | null;
  country: string;
  city: string | null;
  language: string | null;
  industry: string | null;
  products: string[];
  services: string[];
  target_locations: string[];
  customer_personas: string[];
  seed_keywords: string[];
  competitor_domains: string[];
  created_by: string;
}

export interface BusinessProfileUpdate {
  business_name?: string | null;
  primary_domain?: string | null;
  business_type?: string | null;
  website_url?: string | null;
  description?: string | null;
  country?: string | null;
  city?: string | null;
  language?: string | null;
  industry?: string | null;
  products?: string[];
  services?: string[];
  target_locations?: string[];
  customer_personas?: string[];
  seed_keywords?: string[];
  competitor_domains?: string[];
  updated_by?: string | null;
}

export interface Competitor {
  id: string;
  business_profile_id: string;
  competitor_name: string;
  competitor_domain: string;
  competitor_url: string | null;
  relationship_type: CompetitorRelationship;
  authority_score: number | null;
  organic_traffic: number | null;
  organic_keywords: number | null;
  backlinks_count: number | null;
  avg_position: number | null;
  visibility_score: number | null;
  market_share: number | null;
  is_primary: boolean;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitorCreate {
  business_profile_id: string;
  competitor_name: string;
  competitor_domain: string;
  competitor_url: string | null;
  relationship_type: CompetitorRelationship;
  is_primary: boolean;
  notes: string | null;
}

export interface CompetitorUpdate {
  competitor_name?: string | null;
  competitor_domain?: string | null;
  competitor_url?: string | null;
  relationship_type?: CompetitorRelationship | null;
  authority_score?: number | null;
  organic_traffic?: number | null;
  organic_keywords?: number | null;
  backlinks_count?: number | null;
  avg_position?: number | null;
  visibility_score?: number | null;
  market_share?: number | null;
  is_primary?: boolean | null;
  notes?: string | null;
}

export interface Keyword {
  id: string;
  business_profile_id: string;
  keyword_text: string;
  search_volume: number | null;
  search_volume_trend: string | null;
  keyword_difficulty: KeywordDifficulty | null;
  keyword_intent: KeywordIntent | null;
  cpc: number | null;
  competition_level: string | null;
  current_rank: number | null;
  target_url: string | null;
  is_tracked: boolean;
  is_opportunity: boolean;
  opportunity_score: number | null;
  priority: KeywordPriority | null;
  trend: "up" | "down" | "stable" | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KeywordCreate {
  business_profile_id: string;
  keyword_text: string;
  search_volume?: number | null;
  keyword_difficulty?: KeywordDifficulty | null;
  keyword_intent?: KeywordIntent | null;
  cpc?: number | null;
  competition_level?: string | null;
  current_rank?: number | null;
  target_url?: string | null;
  is_tracked?: boolean;
  is_opportunity?: boolean;
  opportunity_score?: number | null;
  priority?: KeywordPriority | null;
  notes?: string | null;
}

export interface KeywordUpdate {
  search_volume?: number | null;
  search_volume_trend?: string | null;
  keyword_difficulty?: KeywordDifficulty | null;
  keyword_intent?: KeywordIntent | null;
  cpc?: number | null;
  competition_level?: string | null;
  current_rank?: number | null;
  target_url?: string | null;
  is_tracked?: boolean | null;
  is_opportunity?: boolean | null;
  opportunity_score?: number | null;
  priority?: KeywordPriority | null;
  trend?: "up" | "down" | "stable" | null;
  notes?: string | null;
  updated_by?: string | null;
}

export interface KeywordCluster {
  id: string;
  business_profile_id: string;
  cluster_name: string;
  cluster_type: string;
  description: string | null;
  keyword_count: number;
  avg_volume: number | null;
  avg_difficulty: number | null;
  intent: KeywordIntent | null;
  opportunity_score: number | null;
  primary_topic: string | null;
  related_topics: string[];
  keywords: Keyword[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KeywordClusterCreate {
  business_profile_id: string;
  cluster_name: string;
  cluster_type: string;
  description?: string | null;
}

export interface KeywordClusterUpdate {
  cluster_name?: string | null;
  cluster_type?: string | null;
  description?: string | null;
  is_active?: boolean | null;
}

export interface KeywordOpportunity {
  id: string;
  business_profile_id: string;
  keyword_text: string;
  search_volume: number | null;
  keyword_difficulty: string | null;
  opportunity_score: number | null;
  intent_alignment: string | null;
  gap_type: string | null;
  competitor_rankings: Record<string, unknown> | null;
  target_url: string | null;
  is_actionable: boolean;
  created_by: string;
  created_at: string;
}

export interface SERPResult {
  id: string;
  business_profile_id: string;
  keyword_id: string | null;
  keyword_text: string;
  search_engine: string;
  country_code: string | null;
  language_code: string | null;
  device: string;
  position: number | null;
  title: string | null;
  url: string | null;
  snippet: string | null;
  featured_snippet: boolean;
  people_also_ask_count: number | null;
  paid_results_count: number | null;
  organic_results_count: number | null;
  rank_change: number | null;
  recorded_at: string;
}

export interface RankTrackingEntry {
  id: string;
  business_profile_id: string;
  keyword_id: string;
  keyword_text: string;
  current_position: number | null;
  previous_position: number | null;
  target_url: string | null;
  search_engine: string;
  device: string;
  country_code: string | null;
  language_code: string | null;
  status: RankTrackingStatus;
  tracked_at: string;
  previous_tracked_at: string | null;
}

export interface KeywordResearchResult {
  id: string;
  business_profile_id: string;
  keyword_text: string;
  search_volume: number | null;
  keyword_difficulty: number | null;
  cpc: number | null;
  competition: number | null;
  intent: KeywordIntent | null;
  opportunity_score: number | null;
  trend: "up" | "down" | "stable" | null;
  source: string;
  created_at: string;
}

export interface ContentGap {
  id: string;
  business_profile_id: string;
  keyword: string;
  topic: string;
  opportunity_score: number;
  priority: KeywordPriority;
  current_ranking: number | null;
  difficulty: number | null;
  volume: number | null;
  competitor_url: string | null;
  gap_type: string;
}

export interface SearchTrend {
  date: string;
  volume: number;
  growth: number;
}

export interface Recommendation {
  id: string;
  business_profile_id: string;
  title: string;
  description: string;
  priority: KeywordPriority;
  impact: string;
  estimated_traffic: number | null;
  estimated_leads: number | null;
  difficulty: "easy" | "moderate" | "hard";
  recommended_action: string;
  status: "pending" | "approved" | "rejected" | "completed";
  keyword_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketInsight {
  total_keywords: number;
  total_competitors: number;
  avg_position: number | null;
  search_visibility: number | null;
  estimated_traffic: number | null;
  content_gap_score: number | null;
  ai_confidence: number | null;
  opportunity_score: number | null;
  last_scan: string | null;
  keyword_growth: number;
  ranking_distribution: { position: string; count: number }[];
  competition_distribution: { level: string; count: number }[];
  search_intent_distribution: { intent: string; count: number }[];
  market_share: { competitor: string; share: number }[];
}

export interface BusinessKeywordCompetitorFilters {
  search?: string;
  website?: string;
  business?: string;
  country?: string;
  city?: string;
  language?: string;
  industry?: string;
  keyword_type?: string;
  intent?: KeywordIntent;
  competition?: string;
  difficulty?: string;
  search_volume_min?: number;
  search_volume_max?: number;
  priority?: KeywordPriority;
  ranking_min?: number;
  ranking_max?: number;
  competitor?: string;
  date_from?: string;
  date_to?: string;
}

export type CompetitorRelationship = "direct" | "indirect" | "aspirational";
export type KeywordDifficulty = "easy" | "medium" | "hard";
export type KeywordIntent = "informational" | "navigational" | "commercial" | "transactional" | "local" | "branded" | "question";
export type KeywordPriority = "critical" | "high" | "medium" | "low";
export type RankTrackingStatus = "tracking" | "lost" | "new" | "improved" | "declined";

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ResearchScanRequest {
  business_profile_id: string;
  competitors?: string[];
  keywords?: string[];
  locations?: string[];
  language?: string;
  country?: string;
}

export interface ResearchScanResponse {
  scan_id: string;
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at?: string;
  keywords_found: number;
  competitors_analyzed: number;
  opportunities_identified: number;
}

export interface ExportResponse {
  download_url: string;
  format: "csv" | "xlsx" | "pdf";
  expires_at: string;
}

export interface ResearchHistoryEntry {
  id: string;
  business_profile_id: string;
  scan_type: string;
  status: "completed" | "failed" | "running";
  keywords_processed: number;
  competitors_analyzed: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  correlation_id: string;
}