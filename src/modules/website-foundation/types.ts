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
  version: string;
  status: "active" | "inactive";
  author: string;
  license: string;
  updated: string;
  description: string;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  status: "enabled" | "disabled";
  autoUpdate: boolean;
  license: string;
  lastUpdated: string;
  description: string;
  dependencies: string[];
  health: Status;
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

export interface BacklogIssue {
  id: string;
  issue: string;
  severity: Severity;
  category: string;
  priority: Priority;
  detected: string;
  assignedTo: string;
  status: IssueStatus;
  dueDate: string;
  resolution: string;
  aiRecommendation: string;
}

export interface RollbackEntry {
  id: string;
  type: "version" | "backup" | "deployment";
  version: string;
  environment: Environment;
  changedBy: string;
  changedAt: string;
  reason: string;
  snapshot: string;
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
