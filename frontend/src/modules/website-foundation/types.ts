// Enterprise DTOs for the Website Foundation module.
// All components import from these types — no hardcoded data inside components.

export type Environment = "production" | "staging" | "development";

export type Severity = "critical" | "high" | "medium" | "low";
export type Priority = "p0" | "p1" | "p2" | "p3";
export type Status = "good" | "warn" | "bad" | "info";
export type IssueStatus = "open" | "in_progress" | "resolved" | "deferred";
export type ApprovalState = "pending" | "approved" | "rejected" | "changes_requested";
export type JobState = "queued" | "running" | "completed" | "failed" | "cancelled";
export type Viewport = "desktop" | "laptop" | "tablet" | "mobile" | "landscape" | "portrait";

export interface Website {
  id: string;
  name: string;
  url: string;
  domain: string;
  protocol: "https" | "http";
  environment: Environment;
  status: "online" | "degraded" | "offline";
  health: number;
  performance: number;
  seo: number;
  security: number;
  responsive: number;
  lastScan: string;
  nextScan: string;
  cms: string;
  hosting: string;
  version: string;
  ssl: string;
  registrar: string;
  dns: string;
  ip: string;
  location: string;
  whois: string;
  storage: number;
  cpu: number;
  memory: number;
  uptime: string;
  diskUsage: number;
  issues: number;
  updated: string;
}

export interface WizardData {
  // Step 1
  name: string;
  url: string;
  domain: string;
  protocol: "https" | "http";
  // Step 2
  hostingProvider: string;
  hostingType: "shared" | "cloud" | "dedicated" | "vps";
  hostingUsername: string;
  hostingPassword: string;
  accessProtocol: "ftp" | "sftp" | "ssh";
  // Step 3
  wpAdminUrl: string;
  wpUsername: string;
  wpAppPassword: string;
  restApiStatus: "active" | "inactive";
  xmlrpcStatus: "enabled" | "disabled";
  // Step 4
  logo: string;
  darkLogo: string;
  lightLogo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  fonts: string;
  brandGuidelinesPdf: string;
  // Step 5
  currentTheme: string;
  childTheme: string;
  themeVersion: string;
  themeLicense: string;
  // Step 6
  selectedPlugins: string[];
}

export interface WordPressInfo {
  version: string;
  phpVersion: string;
  databaseVersion: string;
  dbEngine: "MySQL" | "MariaDB";
  restApi: boolean;
  cron: boolean;
  xmlrpc: boolean;
  debug: boolean;
  maintenance: boolean;
  autoUpdates: boolean;
  language: string;
  timezone: string;
  permalink: string;
  memoryLimit: string;
  diskUsage: number;
  uptime: string;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  version: string;
  status: "active" | "inactive";
  author: string;
  license: string;
  updated: string;
  description: string;
  screenshot?: string;
  themeUri?: string;
  parent?: string;
  requiresWp?: string;
  requiresPhp?: string;
  autoUpdate?: boolean;
  lastUpdated?: string;
}

export interface ThemeDetail {
  name: string;
  slug: string;
  version: string;
  author?: string;
  author_uri?: string;
  description?: string;
  template?: string;
  stylesheet?: string;
  theme_root?: string;
  theme_root_uri?: string;
  screenshot?: string;
  screenshot_uri?: string;
  tags?: string[];
  theme_uri?: string;
  license?: string;
  license_uri?: string;
  text_domain?: string;
  domain_path?: string;
  requires_wp?: string;
  requires_php?: string;
  requires?: string;
  tested_wp?: string;
  tested_php?: string;
  last_updated?: string;
  active: boolean;
  auto_update?: boolean;
  parent?: string;
  sections?: Record<string, string>;
  ratings?: Record<string, number>;
  num_ratings?: number;
  average_rating?: number;
  rating?: number;
  support?: string;
  downloads?: number;
  added?: string;
  homepage?: string;
  author_profile?: string;
  donate_link?: string;
}

export interface ThemeInstallResponse {
  success: boolean;
  message: string;
  theme?: { name: string; slug: string; version: string };
}

export interface ThemeActivateResponse {
  success: boolean;
  message: string;
  previous_theme?: string | null;
  current_theme?: string;
  status: string;
}

export interface ThemeDeleteResponse {
  success: boolean;
  message: string;
  slug: string;
}

export interface ThemeUpdateResponse {
  success: boolean;
  message: string;
  theme?: { name: string; slug: string; version: string };
}

export interface Plugin {
  id: string;
  name: string;
  slug: string;
  version: string;
  latestVersion: string;
  status: "enabled" | "disabled";
  active: boolean;
  autoUpdate: boolean;
  author: string;
  description: string;
  license: string;
  lastUpdated: string;
  updateAvailable: boolean;
  requiresWp: string;
  requiresPhp: string;
  testedWp: string;
  pluginUri: string;
  textDomain: string;
  licenseUri: string;
  networkOnly: boolean;
  securityStatus: "ok" | "warning" | "critical" | "unknown";
  vulnerabilityCount: number;
  pluginSize: string;
  installDate: string;
  file: string;
  dependencies: string[];
  health: Status;
  rating: number;
  numRatings: number;
}

export interface PluginDetail {
  name: string;
  slug: string;
  version: string;
  latest_version: string;
  description: string;
  author: string;
  author_profile: string;
  plugin_uri: string;
  text_domain: string;
  domain_path: string;
  network_only: boolean;
  requires_wp: string;
  requires_php: string;
  tested_wp: string;
  license: string;
  license_uri: string;
  update_available: boolean;
  auto_update: boolean;
  active: boolean;
  health: string;
  security_status: string;
  vulnerable: boolean;
  plugin_size: string;
  install_date: string;
  dependencies: string[];
  conflicts: string[];
  categories: string[];
  tags: string[];
  sections: Record<string, string>;
  ratings: Record<string, number>;
  num_ratings: number;
  average_rating: number;
  rating: number;
  support: string;
  downloads: number;
  added: string;
  homepage: string;
  donate_link: string;
}

export interface PluginHealth {
  total_plugins: number;
  active_plugins: number;
  inactive_plugins: number;
  updates_available: number;
  auto_update_enabled: number;
  security_issues: number;
  vulnerable_plugins: number;
  premium_plugins: number;
  free_plugins: number;
  health: "good" | "warning" | "critical";
}

export interface PluginSearchItem {
  name: string;
  slug: string;
  description: string;
  version: string;
  author: string;
  author_profile: string;
  plugin_uri: string;
  rating: number;
  num_ratings: number;
  downloaded: number;
  last_updated: string;
  requires: string;
  tested: string;
  tags: string[];
  sections: Record<string, string>;
  download_link: string;
}

export interface PluginSearchResponse {
  plugins: PluginSearchItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PluginOperationResult {
  success: boolean;
  message: string;
  plugin?: { slug: string; name?: string; version?: string; status?: string; file?: string };
}

export interface PluginLog {
  id: string;
  website_id: string;
  plugin_slug: string;
  plugin_name?: string;
  operation: string;
  status: string;
  result?: Record<string, unknown>;
  error_message?: string;
  executed_by?: string;
  execution_time_seconds?: number;
  created_at: string;
}

export interface PluginSecurityIssue {
  name: string;
  slug: string;
  version: string;
  latest_version: string;
  active: boolean;
  auto_update: boolean;
  vulnerable: boolean;
  abandoned: boolean;
  health: string;
  security_status: string;
  vulnerability_count: number;
  issues: string[];
  last_updated: string;
  requires_wp: string;
  requires_php: string;
  tested_wp: string;
}

export interface BrandAsset {
  logo: string;
  darkLogo: string;
  lightLogo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  typography: { heading: string; body: string };
  mediaCount: number;
}

export interface Form {
  id: string;
  name: string;
  type: "contact" | "newsletter" | "lead" | "popup";
  status: "active" | "draft" | "paused";
  submissions: number;
  conversion: number;
  spamProtected: boolean;
  captured: string;
}

export interface FormManagerField {
  type: string;
  label: string;
  name: string;
  placeholder: string;
  defaultValue: string;
  required: boolean;
  readOnly: boolean;
  hidden: boolean;
  helpText: string;
  width: string;
  cssClass: string;
  validation: Record<string, unknown>;
  position: number;
}

export interface FormManagerForm {
  id: string;
  plugin: string;
  name: string;
  description: string;
  status: "published" | "draft" | "archived";
  shortcode: string;
  fields: FormManagerField[];
  fieldsCount: number;
  entriesCount: number;
  health: "healthy" | "warning" | "critical" | "unknown";
  responsive: boolean;
  responsiveStatus: {
    desktop: "pass" | "warning" | "fail";
    tablet: "pass" | "warning" | "fail";
    mobile: "pass" | "warning" | "fail";
  };
  healthChecks: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface FormManagerHealth {
  total_forms: number;
  published_forms: number;
  draft_forms: number;
  active_forms: number;
  broken_forms: number;
  forms_with_errors: number;
  last_updated: string;
  recently_created: number;
}

export interface FormOperationResult {
  success: boolean;
  message: string;
  form?: { id: string; plugin: string; name: string; status?: string };
}

export interface FormLog {
  id: string;
  website_id: string;
  form_id: string;
  form_name?: string;
  operation: string;
  status: string;
  result?: Record<string, unknown>;
  error_message?: string;
  executed_by?: string;
  execution_time_seconds?: number;
  created_at: string;
}

export interface ResponsiveTest {
  id: string;
  viewport: Viewport;
  resolution: string;
  url: string;
  screenshot: string;
  issues: number;
  pass: boolean;
  touchTargets: number;
  navigation: Status;
  accessibility: number;
}

export interface CoreVitals {
  lcp: number;
  cls: number;
  inp: number;
  ttfb: number;
  speedIndex: number;
  pageSize: number;
}

export interface AuditResult {
  overall: number;
  seo: number;
  performance: number;
  security: number;
  accessibility: number;
  bestPractices: number;
  brokenLinks: number;
  errors404: number;
  errors500: number;
  redirects: number;
  meta: number;
  headings: number;
  images: number;
  schema: number;
  canonical: number;
  robots: number;
  sitemap: number;
  openGraph: number;
  twitterCards: number;
}

export interface ComponentInventory {
  pages: number;
  posts: number;
  menus: number;
  widgets: number;
  themes: number;
  plugins: number;
  forms: number;
  media: number;
  users: number;
  roles: number;
  categories: number;
  tags: number;
  templates: number;
  shortcodes: number;
  customPostTypes: number;
}

export interface Deployment {
  id: string;
  environment: Environment;
  version: string;
  commit: string;
  status: "success" | "running" | "failed" | "pending";
  pipeline: string;
  releaseNotes: string;
  deployedAt: string;
  deployedBy: string;
}

export interface Approval {
  id: string;
  type: "theme" | "plugin" | "deployment" | "release";
  title: string;
  requestedBy: string;
  reviewer: string;
  state: ApprovalState;
  comments: string;
  createdAt: string;
}

export interface AutomationJob {
  id: string;
  name: string;
  state: JobState;
  progress: number;
  startedAt: string;
  finishedAt?: string;
  duration: number;
  runner: string;
}

export interface LogEntry {
  id: string;
  type: "audit" | "system" | "error" | "activity";
  message: string;
  level: Severity;
  actor: string;
  timestamp: string;
  correlationId: string;
  traceId: string;
}

export interface AIInsight {
  id: string;
  kind: "summary" | "recommendation" | "health" | "plugin" | "theme" | "issue" | "fix";
  title: string;
  body: string;
  confidence: number;
}
