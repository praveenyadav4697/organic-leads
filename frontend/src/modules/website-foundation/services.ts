// Service layer — every read filters through here. Components stay pure.
// Wired to FastAPI endpoints by replacing these implementations with API clients.

import type {
  Website,
  WordPressInfo,
  Theme,
  Plugin,
  BrandAsset,
  Form,
  ResponsiveTest,
  CoreVitals,
  AuditResult,
  ComponentInventory,
  BacklogIssue,
  RollbackEntry,
  Deployment,
  Approval,
  AutomationJob,
  LogEntry,
  AIInsight,
  Environment,
  Status,
} from "./types";

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const seedWebsite: Website = {
  id: "ws_001",
  name: "Acme Marketing Site",
  url: "https://acme.io",
  domain: "acme.io",
  protocol: "https",
  environment: "production",
  status: "online",
  health: 96,
  performance: 92,
  seo: 87,
  security: 98,
  responsive: 100,
  lastScan: "2026-07-28T08:14:00Z",
  nextScan: "2026-07-29T08:14:00Z",
  cms: "WordPress 6.6.1",
  hosting: "Kinsta · LXC",
  version: "v3.12.0",
  ssl: "A+ · Auto-renew",
  registrar: "Cloudflare",
  dns: "Cloudflare",
  ip: "104.21.55.21",
  location: "Iowa · EU-WEST",
  whois: "Privacy on",
  storage: 62,
  cpu: 38,
  memory: 71,
  uptime: "99.987%",
  diskUsage: 62,
  issues: 2,
  updated: "2h ago",
};

const seedThemes: Theme[] = [
  { id: "t1", name: "Nebula", version: "3.4.0", status: "active", author: "Nebula Labs", license: "GPL v2", updated: "2026-07-12", description: "Primary editorial theme." },
  { id: "t2", name: "Nebula Child", version: "1.2.0", status: "inactive", author: "Acme", license: "Proprietary", updated: "2026-06-29", description: "Brand child theme." },
  { id: "t3", name: "Astra", version: "4.6.2", status: "inactive", author: "Brainstorm Force", license: "GPL v2", updated: "2026-05-10", description: "Performance-first starter." },
  { id: "t4", name: "Kadence", version: "1.2.1", status: "inactive", author: "Kadence WP", license: "GPL v2", updated: "2026-04-22", description: "Block-based starter." },
  { id: "t5", name: "GeneratePress", version: "3.4.0", status: "inactive", author: "Tom Usborne", license: "GPL v2", updated: "2026-04-01", description: "Lightweight premium." },
];

const seedPlugins: Plugin[] = [
  { id: "p1", name: "Rank Math SEO", version: "1.0.220", status: "enabled", autoUpdate: true, license: "GPL", lastUpdated: "2026-07-22", description: "Search engine optimization.", dependencies: [], health: "good" },
  { id: "p2", name: "WP Rocket", version: "3.16.2", status: "enabled", autoUpdate: true, license: "Premium", lastUpdated: "2026-07-18", description: "Performance caching.", dependencies: [], health: "good" },
  { id: "p3", name: "Elementor Pro", version: "3.24.0", status: "enabled", autoUpdate: false, license: "Premium", lastUpdated: "2026-05-30", description: "Page builder.", dependencies: ["Elementor"], health: "warn" },
  { id: "p4", name: "Wordfence", version: "7.11.4", status: "enabled", autoUpdate: true, license: "Freemium", lastUpdated: "2026-07-25", description: "Security suite.", dependencies: [], health: "good" },
  { id: "p5", name: "MonsterInsights", version: "8.27.0", status: "enabled", autoUpdate: true, license: "Premium", lastUpdated: "2026-07-14", description: "Google Analytics.", dependencies: ["GA4"], health: "good" },
  { id: "p6", name: "WPForms", version: "1.9.0", status: "enabled", autoUpdate: true, license: "Premium", lastUpdated: "2026-07-10", description: "Form builder.", dependencies: [], health: "good" },
  { id: "p7", name: "Yoast SEO", version: "23.2", status: "disabled", autoUpdate: false, license: "GPL", lastUpdated: "2026-03-12", description: "SEO platform.", dependencies: [], health: "info" },
  { id: "p8", name: "Akismet", version: "5.3", status: "enabled", autoUpdate: true, license: "Freemium", lastUpdated: "2026-07-01", description: "Anti-spam.", dependencies: [], health: "good" },
  { id: "p9", name: "UpdraftPlus", version: "2.23.3", status: "enabled", autoUpdate: true, license: "GPL", lastUpdated: "2026-07-08", description: "Backups.", dependencies: [], health: "good" },
  { id: "p10", name: "Smush", version: "3.16.0", status: "enabled", autoUpdate: true, license: "Freemium", lastUpdated: "2026-06-29", description: "Image optimization.", dependencies: [], health: "good" },
];

const seedForms: Form[] = [
  { id: "f1", name: "Contact — General", type: "contact", status: "active", submissions: 482, conversion: 62, spamProtected: true, captured: "2026-07-28" },
  { id: "f2", name: "Newsletter — Hero", type: "newsletter", status: "active", submissions: 3120, conversion: 14, spamProtected: true, captured: "2026-07-28" },
  { id: "f3", name: "Demo Request", type: "lead", status: "active", submissions: 218, conversion: 41, spamProtected: true, captured: "2026-07-27" },
  { id: "f4", name: "Exit-intent Discount", type: "popup", status: "active", submissions: 1024, conversion: 8, spamProtected: true, captured: "2026-07-27" },
  { id: "f5", name: "Webinar RSVP", type: "lead", status: "draft", submissions: 0, conversion: 0, spamProtected: true, captured: "—" },
  { id: "f6", name: "Pricing Inquiry", type: "contact", status: "active", submissions: 96, conversion: 78, spamProtected: true, captured: "2026-07-26" },
];

const seedResponsive: ResponsiveTest[] = [
  { id: "r1", viewport: "desktop", resolution: "1920×1080", url: "/", screenshot: "", issues: 0, pass: true, touchTargets: 0, navigation: "good", accessibility: 96 },
  { id: "r2", viewport: "laptop", resolution: "1440×900", url: "/", screenshot: "", issues: 0, pass: true, touchTargets: 0, navigation: "good", accessibility: 95 },
  { id: "r3", viewport: "tablet", resolution: "768×1024", url: "/", screenshot: "", issues: 1, pass: true, touchTargets: 44, navigation: "good", accessibility: 92 },
  { id: "r4", viewport: "mobile", resolution: "390×844", url: "/", screenshot: "", issues: 2, pass: true, touchTargets: 48, navigation: "warn", accessibility: 90 },
  { id: "r5", viewport: "landscape", resolution: "844×390", url: "/", screenshot: "", issues: 1, pass: true, touchTargets: 48, navigation: "good", accessibility: 91 },
  { id: "r6", viewport: "portrait", resolution: "390×844", url: "/", screenshot: "", issues: 2, pass: true, touchTargets: 48, navigation: "warn", accessibility: 90 },
];

const seedBacklog: BacklogIssue[] = [
  { id: "i1", issue: "Missing meta descriptions on 4 high-traffic pages", severity: "high", category: "SEO", priority: "p1", detected: "2026-07-26", assignedTo: "Ava Kepler", status: "open", dueDate: "2026-07-30", resolution: "—", aiRecommendation: "Auto-generate descriptions from H1 + first 160 chars using GPT." },
  { id: "i2", issue: "CLS regression on /pricing after Elementor update", severity: "critical", category: "Performance", priority: "p0", detected: "2026-07-27", assignedTo: "Marcus Lane", status: "in_progress", dueDate: "2026-07-29", resolution: "—", aiRecommendation: "Reserve 64px height for hero media via width/height attributes." },
  { id: "i3", issue: "WordPress XML-RPC exposed", severity: "medium", category: "Security", priority: "p2", detected: "2026-07-22", assignedTo: "Ivy Sun", status: "open", dueDate: "2026-08-03", resolution: "—", aiRecommendation: "Disable XML-RPC unless Jetpack is required; add WAF rule." },
  { id: "i4", issue: "12 images missing alt text", severity: "low", category: "Accessibility", priority: "p3", detected: "2026-07-21", assignedTo: "Ava Kepler", status: "open", dueDate: "2026-08-10", resolution: "—", aiRecommendation: "Use vision model to propose alt text from image caption." },
  { id: "i5", issue: "Broken link on /blog/2024/ai-trends", severity: "medium", category: "SEO", priority: "p2", detected: "2026-07-19", assignedTo: "Marcus Lane", status: "resolved", dueDate: "2026-07-25", resolution: "301 redirect to /blog/ai-trends", aiRecommendation: "—" },
  { id: "i6", issue: "Robots.txt blocks /api/v2/*", severity: "high", category: "SEO", priority: "p1", detected: "2026-07-18", assignedTo: "Ivy Sun", status: "deferred", dueDate: "2026-08-15", resolution: "—", aiRecommendation: "Allow crawl of read-only endpoints only." },
];

const seedRollback: RollbackEntry[] = [
  { id: "rb1", type: "version", version: "v3.12.0", environment: "production", changedBy: "Ava Kepler", changedAt: "2026-07-28T06:14:00Z", reason: "CWV optimization", snapshot: "snap_39291" },
  { id: "rb2", type: "deployment", version: "v3.11.4", environment: "production", changedBy: "Marcus Lane", changedAt: "2026-07-27T03:00:00Z", reason: "Hotfix: cookie banner", snapshot: "snap_39284" },
  { id: "rb3", type: "backup", version: "v3.11.3", environment: "production", changedBy: "CI", changedAt: "2026-07-25T03:00:00Z", reason: "Security patches", snapshot: "snap_39271" },
  { id: "rb4", type: "deployment", version: "v3.11.2", environment: "staging", changedBy: "Ivy Sun", changedAt: "2026-07-23T14:42:00Z", reason: "Refactor blog index", snapshot: "snap_39260" },
  { id: "rb5", type: "backup", version: "v3.11.1", environment: "development", changedBy: "CI", changedAt: "2026-07-22T03:00:00Z", reason: "Nightly backup", snapshot: "snap_39252" },
];

const seedDeployments: Deployment[] = [
  { id: "d1", environment: "production", version: "v3.12.0", commit: "a91f3c2", status: "success", pipeline: "Prod · Cloudflare", releaseNotes: "Core Web Vitals optimizations, removed jQuery dep.", deployedAt: "2026-07-28T06:14:00Z", deployedBy: "Ava Kepler" },
  { id: "d2", environment: "staging", version: "v3.12.1-rc.1", commit: "f2b8e90", status: "running", pipeline: "Stage · Kinsta", releaseNotes: "Elementor 3.24 compatibility test.", deployedAt: "2026-07-28T09:01:00Z", deployedBy: "CI" },
  { id: "d3", environment: "development", version: "v3.12.1-rc.2", commit: "0d33a01", status: "pending", pipeline: "Dev · Docker", releaseNotes: "Initial form-builder refactor.", deployedAt: "2026-07-28T09:42:00Z", deployedBy: "Marcus Lane" },
  { id: "d4", environment: "production", version: "v3.11.4", commit: "311a7c8", status: "success", pipeline: "Prod · Cloudflare", releaseNotes: "Hotfix cookie banner.", deployedAt: "2026-07-27T03:00:00Z", deployedBy: "Marcus Lane" },
  { id: "d5", environment: "production", version: "v3.11.3", commit: "8e21bb0", status: "failed", pipeline: "Prod · Cloudflare", releaseNotes: "Security patches — rolled back.", deployedAt: "2026-07-25T03:00:00Z", deployedBy: "CI" },
];

const seedApprovals: Approval[] = [
  { id: "a1", type: "theme", title: "Activate Nebula v3.4.0", requestedBy: "Ava Kepler", reviewer: "Marcus Lane", state: "approved", comments: "Looks good.", createdAt: "2026-07-26" },
  { id: "a2", type: "plugin", title: "Install WP Rocket v3.16.2", requestedBy: "Ivy Sun", reviewer: "Ava Kepler", state: "pending", comments: "Awaiting budget sign-off.", createdAt: "2026-07-27" },
  { id: "a3", type: "deployment", title: "Deploy v3.12.0 to production", requestedBy: "CI", reviewer: "Ava Kepler", state: "approved", comments: "Auto-approved by pipeline.", createdAt: "2026-07-28" },
  { id: "a4", type: "release", title: "Q3 release — Marketing Hub", requestedBy: "Ava Kepler", reviewer: "Marcus Lane", state: "changes_requested", comments: "Add changelog to release notes.", createdAt: "2026-07-25" },
  { id: "a5", type: "plugin", title: "Update Elementor Pro to 3.24", requestedBy: "Marcus Lane", reviewer: "Ivy Sun", state: "rejected", comments: "Hold: CLS regression on /pricing.", createdAt: "2026-07-27" },
];

const seedJobs: AutomationJob[] = [
  { id: "j1", name: "Nightly backup", state: "completed", progress: 100, startedAt: "2026-07-28T03:00:00Z", finishedAt: "2026-07-28T03:18:00Z", duration: 1080, runner: "cron-prod-01" },
  { id: "j2", name: "Weekly SEO audit", state: "running", progress: 64, startedAt: "2026-07-28T09:00:00Z", duration: 1320, runner: "audit-uk-2" },
  { id: "j3", name: "Image optimization bulk", state: "queued", progress: 0, startedAt: "", duration: 0, runner: "—" },
  { id: "j4", name: "Staging deploy", state: "running", progress: 28, startedAt: "2026-07-28T09:01:00Z", duration: 1840, runner: "ci-runner-7" },
  { id: "j5", name: "Plugin update scan", state: "failed", progress: 41, startedAt: "2026-07-28T08:12:00Z", finishedAt: "2026-07-28T08:13:00Z", duration: 60, runner: "scan-eu-1" },
  { id: "j6", name: "Schema validator", state: "completed", progress: 100, startedAt: "2026-07-28T07:00:00Z", finishedAt: "2026-07-28T07:02:11Z", duration: 131, runner: "schema-1" },
];

const seedLogs: LogEntry[] = [
  { id: "l1", type: "audit", message: "Approved deployment v3.12.0", level: "low", actor: "Ava Kepler", timestamp: "2026-07-28T06:14:00Z", correlationId: "corr_a91f3c2", traceId: "trc_7Y2H" },
  { id: "l2", type: "system", message: "Cron: scheduled nightly backup", level: "low", actor: "system", timestamp: "2026-07-28T03:00:00Z", correlationId: "corr_backup_0328", traceId: "trc_8K1P" },
  { id: "l3", type: "error", message: "Elementor render failed on /pricing — OutOfMemory", level: "high", actor: "wp-runtime", timestamp: "2026-07-27T22:14:00Z", correlationId: "corr_elm_oome", traceId: "trc_2Q9F" },
  { id: "l4", type: "activity", message: "Logged in from new IP 84.12.41.20", level: "medium", actor: "ava@acme.io", timestamp: "2026-07-27T11:02:00Z", correlationId: "corr_login_218", traceId: "trc_4D5G" },
  { id: "l5", type: "audit", message: "Plugin disabled: Yoast SEO", level: "low", actor: "Ivy Sun", timestamp: "2026-07-26T09:32:00Z", correlationId: "corr_plugin_yoast", traceId: "trc_5J7K" },
  { id: "l6", type: "error", message: "504 from origin at edge — auto-recovered", level: "medium", actor: "edge", timestamp: "2026-07-25T18:42:00Z", correlationId: "corr_edge_504", traceId: "trc_1R3T" },
];

const seedAI: AIInsight[] = [
  { id: "ai1", kind: "summary", title: "Website summary", body: "acme.io is a healthy WordPress 6.6.1 site on Kinsta with 96/100 health. SEO and performance are strong; one accessibility improvement is in progress.", confidence: 0.92 },
  { id: "ai2", kind: "recommendation", title: "Boost SEO to 92+", body: "Add product schema to /products and tighten meta descriptions on 4 high-traffic pages. Estimated lift: +5 points in 7 days.", confidence: 0.88 },
  { id: "ai3", kind: "health", title: "Health analysis", body: "Performance is steady (92%). Disk usage is at 62% — projected to reach 80% in 41 days. Consider archiving backups older than 30 days.", confidence: 0.81 },
  { id: "ai4", kind: "plugin", title: "Suggested plugin", body: "Add 'ShortPixel' for additional image compression — currently Smush handles JPGs but WebP pass is missing.", confidence: 0.74 },
  { id: "ai5", kind: "theme", title: "Theme suggestion", body: "Nebula v3.4.0 is current. A v3.5.0 release candidate is available with core-web-vitals improvements.", confidence: 0.79 },
  { id: "ai6", kind: "issue", title: "Explain issue", body: "The CLS regression on /pricing is caused by web fonts loading without size-adjust. Adding size-adjust and a fallback metric font should stabilize the layout.", confidence: 0.86 },
  { id: "ai7", kind: "fix", title: "Fix recommendation", body: "Add 'font-size-adjust: 0.5' to body and preload Inter Variable. Estimated CLS improvement: 0.18 → 0.04.", confidence: 0.9 },
];

export const websiteService = {
  async list(): Promise<Website[]> { await wait(); return [seedWebsite]; },
  async get(): Promise<Website> { await wait(); return seedWebsite; },
  async update(_id: string, patch: Partial<Website>): Promise<Website> { await wait(); return { ...seedWebsite, ...patch }; },
  async runAudit(): Promise<Website> { await wait(); return seedWebsite; },
  async runSpeedTest(): Promise<Website> { await wait(); return seedWebsite; },
  async sync(): Promise<Website> { await wait(); return seedWebsite; },
  async backup(): Promise<{ id: string }> { await wait(); return { id: "snap_" + Date.now() }; },
  async deploy(version: string): Promise<Deployment> { await wait(); return seedDeployments[0]; },
  async restore(id: string): Promise<Website> { await wait(); return { ...seedWebsite, version: id }; },
};

export const wordpressService = {
  async get(): Promise<WordPressInfo> {
    await wait();
    return {
      version: "6.6.1",
      phpVersion: "8.3.6",
      databaseVersion: "10.11.4",
      dbEngine: "MariaDB",
      restApi: true,
      cron: true,
      xmlrpc: false,
      debug: false,
      maintenance: false,
      autoUpdates: true,
      language: "en_US",
      timezone: "UTC",
      permalink: "/%postname%/",
      memoryLimit: "512M",
      diskUsage: 62,
      uptime: "99.987%",
    };
  },
};

export const themeService = {
  async list(): Promise<Theme[]> { await wait(); return seedThemes; },
  async activate(id: string): Promise<Theme> { await wait(); return { ...seedThemes[0], id, status: "active" }; },
  async upload(_file: File): Promise<Theme> { await wait(); return { ...seedThemes[0], id: "t_new", name: "Uploaded Theme" }; },
  async delete(id: string): Promise<{ id: string }> { await wait(); return { id }; },
  async update(id: string): Promise<Theme> { await wait(); return { ...seedThemes[0], id }; },
};

export const pluginService = {
  async list(): Promise<Plugin[]> { await wait(); return seedPlugins; },
  async enable(id: string): Promise<Plugin> { await wait(); return { ...seedPlugins[0], id, status: "enabled" }; },
  async disable(id: string): Promise<Plugin> { await wait(); return { ...seedPlugins[0], id, status: "disabled" }; },
  async install(_name: string): Promise<Plugin> { await wait(); return { ...seedPlugins[0], id: "p_new", name: "New Plugin" }; },
  async delete(id: string): Promise<{ id: string }> { await wait(); return { id }; },
  async update(id: string): Promise<Plugin> { await wait(); return { ...seedPlugins[0], id }; },
};

export const brandService = {
  async get(): Promise<BrandAsset> {
    await wait();
    return {
      logo: "logo-primary.svg",
      darkLogo: "logo-dark.svg",
      lightLogo: "logo-light.svg",
      favicon: "favicon.ico",
      primaryColor: "#6366f1",
      secondaryColor: "#22d3ee",
      typography: { heading: "Inter", body: "Inter" },
      mediaCount: 1842,
    };
  },
  async upload(_file: File): Promise<{ url: string }> { await wait(); return { url: "https://cdn.acme.io/asset-" + Date.now() }; },
  async update(_patch: Partial<BrandAsset>): Promise<BrandAsset> { await wait(); return (await brandService.get()); },
};

export const formService = {
  async list(): Promise<Form[]> { await wait(); return seedForms; },
};

export const responsiveService = {
  async list(): Promise<ResponsiveTest[]> { await wait(); return seedResponsive; },
  async capture(_viewport: string): Promise<ResponsiveTest> { await wait(); return seedResponsive[0]; },
};

export const performanceService = {
  async vitals(): Promise<CoreVitals> {
    await wait();
    return { lcp: 1.4, cls: 0.06, inp: 180, ttfb: 320, speedIndex: 2.1, pageSize: 1.8 };
  },
  async recommendations(): Promise<string[]> {
    await wait();
    return [
      "Preload Inter Variable font",
      "Inline above-the-fold CSS",
      "Serve AVIF for hero images",
      "Defer non-critical third-party JS",
      "Enable Brotli at the edge",
    ];
  },
};

export const auditService = {
  async get(): Promise<AuditResult> {
    await wait();
    return {
      overall: 91,
      seo: 87,
      performance: 92,
      security: 98,
      accessibility: 90,
      bestPractices: 95,
      brokenLinks: 3,
      errors404: 1,
      errors500: 0,
      redirects: 12,
      meta: 92,
      headings: 88,
      images: 76,
      schema: 84,
      canonical: 100,
      robots: 100,
      sitemap: 100,
      openGraph: 79,
      twitterCards: 71,
    };
  },
  async inventory(): Promise<ComponentInventory> {
    await wait();
    return {
      pages: 84, posts: 312, menus: 6, widgets: 18, themes: 5, plugins: 24,
      forms: 6, media: 1842, users: 14, roles: 5, categories: 22, tags: 184,
      templates: 41, shortcodes: 9, customPostTypes: 3,
    };
  },
};

export const backlogService = {
  async list(): Promise<BacklogIssue[]> { await wait(); return seedBacklog; },
};

export const rollbackService = {
  async list(): Promise<RollbackEntry[]> { await wait(); return seedRollback; },
  async rollback(id: string): Promise<RollbackEntry> { await wait(); return { ...seedRollback[0], id }; },
  async restore(id: string): Promise<RollbackEntry> { await wait(); return { ...seedRollback[0], id }; },
};

export const deploymentService = {
  async list(): Promise<Deployment[]> { await wait(); return seedDeployments; },
  async deploy(input: { environment: Environment; version: string; commit: string; releaseNotes: string }): Promise<Deployment> {
    await wait();
    return {
      id: "d_" + Date.now(),
      environment: input.environment,
      version: input.version,
      commit: input.commit,
      status: "running",
      pipeline: input.environment === "production" ? "Prod · Cloudflare" : input.environment === "staging" ? "Stage · Kinsta" : "Dev · Docker",
      releaseNotes: input.releaseNotes,
      deployedAt: new Date().toISOString(),
      deployedBy: "You",
    };
  },
};

export const approvalService = {
  async list(): Promise<Approval[]> { await wait(); return seedApprovals; },
  async approve(id: string): Promise<Approval> { await wait(); return { ...seedApprovals[0], id, state: "approved" }; },
  async reject(id: string): Promise<Approval> { await wait(); return { ...seedApprovals[0], id, state: "rejected" }; },
};

export const jobService = {
  async list(): Promise<AutomationJob[]> { await wait(); return seedJobs; },
  async retry(id: string): Promise<AutomationJob> { await wait(); return { ...seedJobs[0], id, state: "queued", progress: 0 }; },
  async cancel(id: string): Promise<AutomationJob> { await wait(); return { ...seedJobs[0], id, state: "cancelled" }; },
};

export const logService = {
  async list(): Promise<LogEntry[]> { await wait(); return seedLogs; },
  async download(_format: "csv" | "xlsx" | "pdf"): Promise<{ url: string }> { await wait(); return { url: "about:blank" }; },
};

export const aiService = {
  async list(): Promise<AIInsight[]> { await wait(); return seedAI; },
  async summary(): Promise<AIInsight> { await wait(); return seedAI[0]; },
  async recommendations(): Promise<AIInsight[]> { await wait(); return seedAI.filter((a) => a.kind === "recommendation" || a.kind === "fix"); },
  async health(): Promise<AIInsight> { await wait(); return seedAI[2]; },
};
