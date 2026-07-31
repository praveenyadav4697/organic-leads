export interface GoogleProductConnection {
  id: string;
  product_type: GoogleProductType;
  product_name: string;
  property_id: string | null;
  tracking_id: string | null;
  account_id: string | null;
  connection_status: ConnectionStatus;
  health_status: HealthStatus;
  is_active: boolean;
  config: Record<string, unknown> | null;
  last_sync_at: string | null;
  synced_by: string | null;
  error_message: string | null;
  foundation_project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TagManagerVariable {
  id: string;
  google_product_id: string;
  variable_name: string;
  variable_type: string;
  is_firing: boolean;
  configuration: Record<string, unknown> | null;
  created_at: string;
}

export interface TagManagerTrigger {
  id: string;
  google_product_id: string;
  trigger_name: string;
  trigger_type: string;
  is_firing: boolean;
  configuration: Record<string, unknown> | null;
  created_at: string;
}

export interface TagManagerTag {
  id: string;
  google_product_id: string;
  tag_name: string;
  tag_type: string;
  is_firing: boolean;
  configuration: Record<string, unknown> | null;
  created_at: string;
}

export interface GoogleAdsAccount {
  id: string;
  google_product_id: string;
  account_id: string;
  account_name: string | null;
  status: string;
  currency_code: string | null;
  time_zone: string | null;
  spend_amount: number | null;
  impressions: number | null;
  clicks: number | null;
  conversions: number | null;
  created_at: string;
}

export interface AdSenseAccount {
  id: string;
  google_product_id: string;
  account_id: string;
  site_url: string | null;
  status: string;
  estimated_earnings: number | null;
  page_views: number | null;
  ad_clicks: number | null;
  ctr: number | null;
  created_at: string;
}

export interface TrendsQuery {
  id: string;
  google_product_id: string;
  query: string;
  region_code: string | null;
  country_code: string | null;
  timeframe: string | null;
  interest_over_time: Record<string, unknown> | null;
  interest_by_region: Record<string, unknown> | null;
  related_queries: Record<string, unknown> | null;
  created_at: string;
}

export type GoogleProductType =
  | "search_console"
  | "google_tag_manager"
  | "google_my_business"
  | "google_ads"
  | "google_adsense"
  | "google_trends"
  | "pagespeed_insights"
  | "fonts"
  | "structured_data";
export type ConnectionStatus = "connected" | "disconnected" | "pending" | "error";
export type HealthStatus = "healthy" | "warning" | "critical" | "unknown";