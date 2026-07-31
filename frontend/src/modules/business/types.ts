export interface BusinessProfileBase {
  business_name: string;
  primary_domain: string;
  business_type: string | null;
  website_url: string | null;
  description: string | null;
  country: string;
}

export interface BusinessProfileCreate extends BusinessProfileBase {
  created_by: string;
}

export interface BusinessProfileUpdate {
  business_name: string | null;
  business_type: string | null;
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  street_address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  phone_number: string | null;
  email: string | null;
  google_place_id: string | null;
  rating: number | null;
  is_verified: boolean | null;
  updated_by: string | null;
}

export interface BusinessProfileResponse extends BusinessProfileBase {
  id: string;
  logo_url: string | null;
  is_verified: boolean;
  created_by: string;
}

export interface CompetitorCreate extends CompetitorBase {
  business_profile_id: string;
  competitor_url: string | null;
  notes: string | null;
}

export interface CompetitorUpdate {
  competitor_name: string | null;
  competitor_domain: string | null;
  competitor_url: string | null;
  relationship_type: CompetitorRelationship | null;
  is_primary: boolean | null;
  notes: string | null;
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
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KeywordUpdate {
  search_volume: number | null;
  search_volume_trend: string | null;
  keyword_difficulty: KeywordDifficulty | null;
  keyword_intent: KeywordIntent | null;
  cpc: number | null;
  competition_level: string | null;
  current_rank: number | null;
  target_url: string | null;
  is_tracked: boolean | null;
  is_opportunity: boolean | null;
  notes: string | null;
  updated_by: string | null;
}

export interface KeywordClusterCreate {
  business_profile_id: string;
  cluster_name: string;
  cluster_type: string;
  description: string | null;
}

export interface KeywordClusterUpdate {
  cluster_name: string | null;
  cluster_type: string | null;
  is_active: boolean | null;
  description: string | null;
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

export type CompetitorRelationship = "direct" | "indirect" | "aspirational";
export type KeywordDifficulty = "easy" | "medium" | "hard";
export type KeywordIntent = "informational" | "navigational" | "transactional" | "commercial" | "local";
export type RankTrackingStatus = "tracking" | "lost" | "new" | "improved" | "declined";

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}