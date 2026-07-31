/* ------------------------------------------------------------------------- */
/*                    Default Models (Render-First Backend)                  */
/* ------------------------------------------------------------------------- */
/* These defaults let the UI render immediately, before the backend          */
/* responds — or when the backend is offline, slow, or returns errors.       */
/* Values are intentionally "Pending Scan" / "Not Available" placeholders   */
/* rather than zero so the layout never appears blank or misleading.         */
/* ------------------------------------------------------------------------- */

export const NOT_AVAILABLE = "Not Available";
export const PENDING_SCAN = "Pending Scan";
export const NEVER_SCANNED = "Never Scanned";

/* ----------------------------- Website Foundation ------------------------ */

export const defaultWebsite = {
  id: "",
  name: "Untitled project",
  url: "",
  domain: "",
  protocol: "https" as const,
  environment: "production" as const,
  status: "pending" as const,
  health: NOT_AVAILABLE,
  performance: NOT_AVAILABLE,
  seo: NOT_AVAILABLE,
  security: NOT_AVAILABLE,
  responsive: NOT_AVAILABLE,
  lastScan: NEVER_SCANNED,
  nextScan: "Scheduled after first scan",
  cms: NOT_AVAILABLE,
  hosting: NOT_AVAILABLE,
  version: NOT_AVAILABLE,
  ssl: NOT_AVAILABLE,
  registrar: NOT_AVAILABLE,
  dns: NOT_AVAILABLE,
  ip: NOT_AVAILABLE,
  location: NOT_AVAILABLE,
  whois: NOT_AVAILABLE,
  storage: NOT_AVAILABLE,
  cpu: NOT_AVAILABLE,
  memory: NOT_AVAILABLE,
  uptime: NOT_AVAILABLE,
  diskUsage: NOT_AVAILABLE,
  issues: 0,
  updated: NEVER_SCANNED,
};

export const defaultWordPressInfo = {
  version: NOT_AVAILABLE,
  phpVersion: NOT_AVAILABLE,
  databaseVersion: NOT_AVAILABLE,
  dbEngine: "MySQL",
  restApi: false,
  cron: false,
  xmlrpc: false,
  debug: false,
  maintenance: false,
  autoUpdates: false,
  language: "en_US",
  timezone: "UTC",
  permalink: NOT_AVAILABLE,
  memoryLimit: NOT_AVAILABLE,
  diskUsage: 0,
  uptime: NOT_AVAILABLE,
};

export const defaultBrandAsset = {
  logo: "",
  darkLogo: "",
  lightLogo: "",
  favicon: "",
  primaryColor: "#6366f1",
  secondaryColor: "#22d3ee",
  typography: { heading: "Inter", body: "Inter" },
  mediaCount: 0,
};

export const defaultCoreVitals = {
  lcp: NOT_AVAILABLE,
  cls: NOT_AVAILABLE,
  inp: NOT_AVAILABLE,
  ttfb: NOT_AVAILABLE,
  speedIndex: NOT_AVAILABLE,
  pageSize: NOT_AVAILABLE,
};

export const defaultAuditResult = {
  overall: 0,
  seo: 0,
  performance: 0,
  security: 0,
  accessibility: 0,
  bestPractices: 0,
  brokenLinks: 0,
  errors404: 0,
  errors500: 0,
  redirects: 0,
  meta: 0,
  headings: 0,
  images: 0,
  schema: 0,
  canonical: 0,
  robots: 0,
  sitemap: 0,
  openGraph: 0,
  twitterCards: 0,
};

export const defaultInventory = {
  pages: 0,
  posts: 0,
  menus: 0,
  widgets: 0,
  themes: 0,
  plugins: 0,
  forms: 0,
  media: 0,
  users: 0,
  roles: 0,
  categories: 0,
  tags: 0,
  templates: 0,
  shortcodes: 0,
  customPostTypes: 0,
};

/* --------------------------- Tracking & Forms --------------------------- */

export const defaultTracker = {
  id: "",
  name: "Untitled tracker",
  type: "unknown",
  identifier: "",
  status: "disconnected",
  health: NOT_AVAILABLE,
  eventsTracked: 0,
  lastEvent: NEVER_SCANNED,
  configuration: {},
};

export const defaultForm = {
  id: "",
  name: "Untitled form",
  url: "",
  fields: [],
  conversionRate: NOT_AVAILABLE,
  submissions: 0,
  abandonmentRate: NOT_AVAILABLE,
  status: "unknown",
};

/* ----------------------------- Search Landscape -------------------------- */

export const defaultKeywordRow = {
  keyword: "—",
  volume: NOT_AVAILABLE,
  difficulty: NOT_AVAILABLE,
  cpc: NOT_AVAILABLE,
  intent: NOT_AVAILABLE,
  opportunity: NOT_AVAILABLE,
  position: NOT_AVAILABLE,
};

export const defaultCompetitor = {
  name: "Unknown competitor",
  domain: "",
  traffic: NOT_AVAILABLE,
  domainAuthority: NOT_AVAILABLE,
  keywords: 0,
  delta: 0,
};

/* ----------------------------- Search Console ---------------------------- */

export const defaultSCProperty = {
  id: "",
  url: "",
  type: "URL Prefix",
  verificationStatus: "unverified",
  coverage: {
    valid: 0,
    warnings: 0,
    errors: 0,
    excluded: 0,
  },
  lastSync: NEVER_SCANNED,
};

/* ----------------------------- Business Intelligence --------------------- */

export const defaultBusinessProfile = {
  id: "",
  businessName: "Untitled profile",
  industry: NOT_AVAILABLE,
  domain: "",
  primaryMarket: NOT_AVAILABLE,
  keywords: 0,
  competitors: 0,
  lastUpdate: NEVER_SCANNED,
};

export const defaultAIRecommendation = {
  id: "",
  title: "No recommendation yet",
  rationale: NOT_AVAILABLE,
  impact: NOT_AVAILABLE,
  effort: NOT_AVAILABLE,
  status: "pending",
};

/* ----------------------------- On-Page SEO ------------------------------- */

export const defaultSEOPage = {
  id: "",
  url: "",
  title: NOT_AVAILABLE,
  metaDescription: NOT_AVAILABLE,
  h1: NOT_AVAILABLE,
  wordCount: NOT_AVAILABLE,
  seoScore: NOT_AVAILABLE,
  issues: 0,
  status: "pending",
};

/* ----------------------------- Performance ------------------------------- */

export const defaultPerformanceCheck = {
  id: "",
  url: "",
  lcp: NOT_AVAILABLE,
  cls: NOT_AVAILABLE,
  inp: NOT_AVAILABLE,
  ttfb: NOT_AVAILABLE,
  performanceScore: NOT_AVAILABLE,
  status: "pending",
};

/* ----------------------------- SEO Audit --------------------------------- */

export const defaultAuditRun = {
  id: "",
  name: "Untitled audit",
  scope: "site",
  issues: 0,
  score: NOT_AVAILABLE,
  createdAt: NEVER_SCANNED,
  status: "pending",
};

/* ----------------------------- Mobile Readiness --------------------------- */

export const defaultMobileTest = {
  id: "",
  url: "",
  device: "Desktop",
  viewport: "1920×1080",
  responsiveScore: NOT_AVAILABLE,
  touchTarget: NOT_AVAILABLE,
  status: "pending",
};

/* ----------------------------- Google Products ---------------------------- */

export const defaultGoogleProduct = {
  id: "",
  product: "unknown",
  account: NOT_AVAILABLE,
  status: "disconnected",
  lastSync: NEVER_SCANNED,
};

/* ----------------------------- Generic Discovery -------------------------- */

export const defaultDiscoveryResult = {
  title: "Scan Pending",
  url: "",
  scannedAt: NEVER_SCANNED,
  fields: {} as Record<string, unknown>,
  summary: "Run a scan to discover configuration.",
};

export function placeholderArray<T>(fallback: T, count = 0): T[] {
  return Array.from({ length: count }, () => ({ ...fallback }));
}
