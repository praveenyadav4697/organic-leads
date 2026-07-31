import { websiteApi } from "@/api/websiteApi";
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

async function getFirstWebsiteId(): Promise<string> {
  const res = await websiteApi.list();
  if (res.items.length === 0) throw new Error("No websites registered");
  return res.items[0].id;
}

export const websiteService = {
  async list(): Promise<Website[]> {
    const res = await websiteApi.list();
    return res.items.map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      domain: w.domain,
      protocol: w.protocol as "https" | "http",
      environment: w.environment as Environment,
      status: w.status as "online" | "degraded" | "offline",
      health: w.health,
      performance: w.performance,
      seo: w.seo,
      security: w.security,
      responsive: w.responsive,
      lastScan: w.lastScan || "",
      nextScan: w.nextScan || "",
      cms: w.cms || "WordPress",
      hosting: w.hosting || "",
      version: w.version || "",
      ssl: w.ssl || "",
      registrar: w.registrar || "",
      dns: w.dns || "",
      ip: w.ip || "",
      location: w.location || "",
      whois: w.whois || "",
      storage: w.storage || 0,
      cpu: w.cpu || 0,
      memory: w.memory || 0,
      uptime: w.uptime || "",
      diskUsage: w.diskUsage || 0,
      issues: w.issues || 0,
      updated: w.updated || "",
    }));
  },
  async get(): Promise<Website> {
    const items = await websiteService.list();
    if (items.length === 0) throw new Error("No websites registered");
    return items[0];
  },
  async update(id: string, patch: Partial<Website>): Promise<Website> {
    await websiteApi.update(id, patch as any);
    return websiteService.get();
  },
  async runAudit(): Promise<Website> {
    const items = await websiteService.list();
    if (items.length === 0) throw new Error("No websites registered");
    return items[0];
  },
  async runSpeedTest(): Promise<Website> {
    const items = await websiteService.list();
    if (items.length === 0) throw new Error("No websites registered");
    return items[0];
  },
  async sync(): Promise<Website> {
    const items = await websiteService.list();
    if (items.length === 0) throw new Error("No websites registered");
    return items[0];
  },
  async backup(): Promise<{ id: string }> {
    return { id: "snap_" + Date.now() };
  },
  async deploy(version: string): Promise<Deployment> {
    return {
      id: "d_" + Date.now(),
      environment: "production",
      version,
      commit: "auto",
      status: "running",
      pipeline: "Auto Deploy",
      releaseNotes: `Deploy version ${version}`,
      deployedAt: new Date().toISOString(),
      deployedBy: "System",
    };
  },
  async restore(id: string): Promise<Website> {
    const items = await websiteService.list();
    if (items.length === 0) throw new Error("No websites registered");
    return { ...items[0], version: id };
  },
};

export const wordpressService = {
  async get(): Promise<WordPressInfo> {
    try {
      const id = await getFirstWebsiteId();
      const data = await websiteApi.getWordpressInfo(id);
      return {
        version: data.version || "Not available from WordPress",
        phpVersion: data.phpVersion || "Not available from WordPress",
        databaseVersion: data.databaseVersion || "Not available from WordPress",
        dbEngine: data.dbEngine || "MySQL",
        restApi: data.restApi ?? false,
        cron: data.cron ?? false,
        xmlrpc: data.xmlrpc ?? false,
        debug: data.debug ?? false,
        maintenance: data.maintenance ?? false,
        autoUpdates: data.autoUpdates ?? false,
        language: data.language || "en_US",
        timezone: data.timezone || "UTC",
        permalink: data.permalink || "Not available from WordPress",
        memoryLimit: data.memoryLimit || "Not available from WordPress",
        diskUsage: data.diskUsage ?? 0,
        uptime: data.uptime || "Not available from WordPress",
      };
    } catch {
      return {
        version: "Not available from WordPress",
        phpVersion: "Not available from WordPress",
        databaseVersion: "Not available from WordPress",
        dbEngine: "MySQL",
        restApi: false,
        cron: false,
        xmlrpc: false,
        debug: false,
        maintenance: false,
        autoUpdates: false,
        language: "en_US",
        timezone: "UTC",
        permalink: "Not available from WordPress",
        memoryLimit: "Not available from WordPress",
        diskUsage: 0,
        uptime: "Not available from WordPress",
      };
    }
  },

  async sync(id: string): Promise<any> {
    return websiteApi.syncWordpress(id);
  },
};

export const themeService = {
  async list(): Promise<Theme[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listThemes(id);
    } catch {
      return [];
    }
  },
  async activate(id: string): Promise<Theme> {
    throw new Error(`Theme activation not yet implemented for ${id}`);
  },
  async upload(_file: File): Promise<Theme> {
    throw new Error("Theme upload not yet implemented");
  },
  async delete(id: string): Promise<{ id: string }> {
    return { id };
  },
  async update(id: string): Promise<Theme> {
    throw new Error(`Theme update not yet implemented for ${id}`);
  },
};

export const pluginService = {
  async list(): Promise<Plugin[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listPlugins(id);
    } catch {
      return [];
    }
  },
  async enable(id: string): Promise<Plugin> {
    throw new Error(`Plugin enable not yet implemented for ${id}`);
  },
  async disable(id: string): Promise<Plugin> {
    throw new Error(`Plugin disable not yet implemented for ${id}`);
  },
  async install(_name: string): Promise<Plugin> {
    throw new Error("Plugin install not yet implemented");
  },
  async delete(id: string): Promise<{ id: string }> {
    return { id };
  },
  async update(id: string): Promise<Plugin> {
    throw new Error(`Plugin update not yet implemented for ${id}`);
  },
};

export const brandService = {
  async get(): Promise<BrandAsset> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getBrandAsset(id);
    } catch {
      return {
        logo: "",
        darkLogo: "",
        lightLogo: "",
        favicon: "",
        primaryColor: "#6366f1",
        secondaryColor: "#22d3ee",
        typography: { heading: "Inter", body: "Inter" },
        mediaCount: 0,
      };
    }
  },
  async upload(_file: File): Promise<{ url: string }> {
    return { url: "" };
  },
  async update(_patch: Partial<BrandAsset>): Promise<BrandAsset> {
    return brandService.get();
  },
};

export const formService = {
  async list(): Promise<Form[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listForms(id);
    } catch {
      return [];
    }
  },
};

export const responsiveService = {
  async list(): Promise<ResponsiveTest[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listResponsiveTests(id);
    } catch {
      return [];
    }
  },
  async capture(_viewport: string): Promise<ResponsiveTest> {
    throw new Error("Responsive capture not yet implemented");
  },
};

export const performanceService = {
  async vitals(): Promise<CoreVitals> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getCoreVitals(id);
    } catch {
      return { lcp: 0, cls: 0, inp: 0, ttfb: 0, speedIndex: 0, pageSize: 0 };
    }
  },
  async recommendations(): Promise<string[]> {
    return [];
  },
};

export const auditService = {
  async get(): Promise<AuditResult> {
    try {
      const id = await getFirstWebsiteId();
      const res = await fetch(`/api/v1/websites/${id}/audit`);
      if (!res.ok) throw new Error("Audit not found");
      return await res.json();
    } catch {
      return {
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
    }
  },
  async inventory(): Promise<ComponentInventory> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getInventory(id);
    } catch {
      return {
        pages: 0, posts: 0, menus: 0, widgets: 0, themes: 0, plugins: 0,
        forms: 0, media: 0, users: 0, roles: 0, categories: 0, tags: 0,
        templates: 0, shortcodes: 0, customPostTypes: 0,
      };
    }
  },
};

export const backlogService = {
  async list(): Promise<BacklogIssue[]> {
    try {
      const id = await getFirstWebsiteId();
      const res = await websiteApi.listBacklogIssues(id);
      return res.items || res;
    } catch {
      return [];
    }
  },
};

export const rollbackService = {
  async list(): Promise<RollbackEntry[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listRollbacks(id);
    } catch {
      return [];
    }
  },
  async rollback(id: string): Promise<RollbackEntry> {
    throw new Error(`Rollback not yet implemented for ${id}`);
  },
  async restore(id: string): Promise<RollbackEntry> {
    throw new Error(`Restore not yet implemented for ${id}`);
  },
};

export const deploymentService = {
  async list(): Promise<Deployment[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listDeployments(id);
    } catch {
      return [];
    }
  },
  async deploy(_input: { environment: Environment; version: string; commit: string; releaseNotes: string }): Promise<Deployment> {
    throw new Error("Deployment not yet implemented");
  },
};

export const approvalService = {
  async list(): Promise<Approval[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listApprovals(id);
    } catch {
      return [];
    }
  },
  async approve(id: string): Promise<Approval> {
    throw new Error(`Approval not yet implemented for ${id}`);
  },
  async reject(id: string): Promise<Approval> {
    throw new Error(`Rejection not yet implemented for ${id}`);
  },
};

export const jobService = {
  async list(): Promise<AutomationJob[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listJobs(id);
    } catch {
      return [];
    }
  },
  async retry(id: string): Promise<AutomationJob> {
    throw new Error(`Retry not yet implemented for ${id}`);
  },
  async cancel(id: string): Promise<AutomationJob> {
    throw new Error(`Cancel not yet implemented for ${id}`);
  },
};

export const logService = {
  async list(): Promise<LogEntry[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listLogs(id);
    } catch {
      return [];
    }
  },
  async download(_format: "csv" | "xlsx" | "pdf"): Promise<{ url: string }> {
    return { url: "" };
  },
};

export const aiService = {
  async list(): Promise<AIInsight[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listAiInsights(id);
    } catch {
      return [];
    }
  },
  async summary(): Promise<AIInsight> {
    throw new Error("AI summary not yet implemented");
  },
  async recommendations(): Promise<AIInsight[]> {
    return [];
  },
  async health(): Promise<AIInsight> {
    throw new Error("AI health not yet implemented");
  },
};