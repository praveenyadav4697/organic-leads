export const kpis = [
  { key: "health", label: "Website Health", value: 94, unit: "%", delta: 3.2, hint: "All systems nominal" },
  { key: "seo", label: "SEO Score", value: 87, unit: "%", delta: 5.1, hint: "3 quick wins available" },
  { key: "perf", label: "Performance", value: 92, unit: "%", delta: 1.8, hint: "LCP 1.4s" },
  { key: "mobile", label: "Mobile Readiness", value: 96, unit: "%", delta: 0.6, hint: "Fully responsive" },
  { key: "tracking", label: "Tracking Status", value: 5, unit: "/5", delta: 0, hint: "All pixels active" },
  { key: "google", label: "Google Integrations", value: 7, unit: "/8", delta: 12, hint: "Merchant Center pending" },
];

export const trafficSeries = [
  { m: "Jan", organic: 4200, paid: 1200, direct: 2100 },
  { m: "Feb", organic: 4600, paid: 1400, direct: 2200 },
  { m: "Mar", organic: 5100, paid: 1500, direct: 2350 },
  { m: "Apr", organic: 5800, paid: 1700, direct: 2500 },
  { m: "May", organic: 6400, paid: 1600, direct: 2700 },
  { m: "Jun", organic: 7100, paid: 1900, direct: 2900 },
  { m: "Jul", organic: 8000, paid: 2100, direct: 3200 },
  { m: "Aug", organic: 8800, paid: 2400, direct: 3400 },
  { m: "Sep", organic: 9600, paid: 2600, direct: 3600 },
];

export const vitals = [
  { name: "LCP", value: 1.4, target: 2.5, unit: "s", status: "good" },
  { name: "FID", value: 42, target: 100, unit: "ms", status: "good" },
  { name: "CLS", value: 0.06, target: 0.1, unit: "", status: "good" },
  { name: "TTFB", value: 320, target: 600, unit: "ms", status: "good" },
  { name: "INP", value: 180, target: 200, unit: "ms", status: "warn" },
];

export const radarSeo = [
  { area: "Meta", score: 92 },
  { area: "Content", score: 84 },
  { area: "Links", score: 76 },
  { area: "Schema", score: 88 },
  { area: "Speed", score: 94 },
  { area: "Mobile", score: 96 },
];

export const websites = [
  { id: "1", domain: "organicleads.io", cms: "Next.js", hosting: "Vercel", health: 96, issues: 2, updated: "2h ago" },
  { id: "2", domain: "northwind.shop", cms: "Shopify", hosting: "Shopify Cloud", health: 88, issues: 6, updated: "5h ago" },
  { id: "3", domain: "helix.ai", cms: "Astro", hosting: "Cloudflare", health: 91, issues: 4, updated: "1d ago" },
  { id: "4", domain: "orbital-labs.com", cms: "WordPress", hosting: "Kinsta", health: 74, issues: 12, updated: "3d ago" },
];

export const keywords = [
  { k: "ai marketing automation", vol: 22400, kd: 62, cpc: 12.4, intent: "Commercial", opp: 88 },
  { k: "enterprise seo platform", vol: 8100, kd: 48, cpc: 9.8, intent: "Commercial", opp: 82 },
  { k: "digital marketing dashboard", vol: 14800, kd: 55, cpc: 7.2, intent: "Informational", opp: 74 },
  { k: "seo audit tool", vol: 33100, kd: 71, cpc: 15.9, intent: "Transactional", opp: 69 },
  { k: "core web vitals optimizer", vol: 5400, kd: 34, cpc: 4.1, intent: "Informational", opp: 91 },
  { k: "google search console alternative", vol: 3600, kd: 29, cpc: 3.4, intent: "Commercial", opp: 86 },
];

export const competitors = [
  { name: "HubSpot", domain: "hubspot.com", traffic: 42_000_000, da: 93, kw: 1_240_000, delta: 4.2 },
  { name: "SEMrush", domain: "semrush.com", traffic: 28_000_000, da: 92, kw: 990_000, delta: -1.1 },
  { name: "Ahrefs", domain: "ahrefs.com", traffic: 16_000_000, da: 91, kw: 780_000, delta: 2.6 },
  { name: "Moz", domain: "moz.com", traffic: 7_400_000, da: 90, kw: 410_000, delta: 0.8 },
];

export const googleProducts = [
  { key: "analytics", name: "Google Analytics", status: "connected", health: 98, sync: "Just now" },
  { key: "search-console", name: "Search Console", status: "connected", health: 96, sync: "12m ago" },
  { key: "tag-manager", name: "Tag Manager", status: "connected", health: 100, sync: "3m ago" },
  { key: "business", name: "Business Profile", status: "connected", health: 91, sync: "1h ago" },
  { key: "merchant", name: "Merchant Center", status: "disconnected", health: 0, sync: "—" },
  { key: "ads", name: "Google Ads", status: "connected", health: 88, sync: "8m ago" },
  { key: "youtube", name: "YouTube", status: "connected", health: 94, sync: "22m ago" },
  { key: "maps", name: "Maps", status: "connected", health: 97, sync: "40m ago" },
];

export const trackers = [
  { name: "Google Tag Manager", id: "GTM-A1B2C3", status: "connected" },
  { name: "Meta Pixel", id: "1029384756", status: "connected" },
  { name: "LinkedIn Insight", id: "insight-8842", status: "disconnected" },
  { name: "Google Ads", id: "AW-998877", status: "connected" },
];

export const seoIssues = [
  { title: "Missing meta descriptions on 4 pages", priority: "high", score: 82 },
  { title: "Improve H1/H2 hierarchy on /pricing", priority: "medium", score: 74 },
  { title: "Add alt text to 12 images", priority: "medium", score: 68 },
  { title: "Add product schema on catalog pages", priority: "high", score: 79 },
  { title: "Enable HTTP/2 push for CSS", priority: "low", score: 60 },
];

export const aiInsights = [
  "Your organic traffic is projected to grow 18% next month if you publish 3 pillar articles on 'AI marketing automation'.",
  "Competitor helix.ai is overtaking on 'enterprise seo platform' — refresh your landing page meta and internal links.",
  "Core Web Vitals passed on 96% of URLs. Focus INP fixes on /dashboard and /pricing for full green.",
  "Merchant Center is disconnected — reconnect to unlock Performance Max recommendations.",
];
