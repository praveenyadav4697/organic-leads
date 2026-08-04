import { websiteApi } from "@/api/websiteApi";
import { toast } from "sonner";
import type {
  Website,
  WordPressInfo,
  Theme,
  ThemeDetail,
  ThemeInstallResponse,
  ThemeActivateResponse,
  ThemeDeleteResponse,
  ThemeUpdateResponse,
  Plugin,
  PluginDetail,
  PluginHealth,
  PluginSearchResponse,
  PluginOperationResult,
  PluginLog,
  PluginSecurityIssue,
  FormManagerForm,
  FormManagerField,
  FormManagerHealth,
  FormOperationResult,
  FormLog,
  BrandAsset,
  Form,
  ResponsiveTest,
  CoreVitals,
  ComponentInventory,
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
      const data = await websiteApi.getDashboard(id);
      const wp = data?.result?.wordpress || data?.wordpress || {};
      const system = data?.result?.system || data?.system || {};
      return {
        version: wp.version || system.wordpress_version || "Not available from WordPress",
        phpVersion: wp.phpVersion || system.php_version || "Not available from WordPress",
        databaseVersion:
          wp.databaseVersion || system.database_version || "Not available from WordPress",
        dbEngine: wp.dbEngine || system.database_engine || "MySQL",
        restApi: wp.restApi ?? system.rest_api_status === "enabled",
        cron: wp.cron ?? system.cron_status === "running",
        xmlrpc: wp.xmlrpc ?? system.xmlrpc_status === "enabled",
        debug: wp.debug ?? system.debug_mode ?? false,
        maintenance: wp.maintenance ?? system.maintenance_mode ?? false,
        autoUpdates: wp.autoUpdates ?? system.automatic_updates ?? false,
        language: wp.language || system.language || "en_US",
        timezone: wp.timezone || system.timezone || "UTC",
        permalink: wp.permalink || system.permalink_structure || "Not available from WordPress",
        memoryLimit: wp.memoryLimit || system.memory_limit || "Not available from WordPress",
        diskUsage: wp.diskUsage ?? system.disk_usage ?? 0,
        uptime: wp.uptime || system.server_uptime || "Not available from WordPress",
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

  async getDashboard(id: string): Promise<any> {
    return websiteApi.getDashboard(id);
  },
};

export const themeService = {
  async list(): Promise<Theme[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listThemes(id);
    } catch (err) {
      toast.error("Failed to load themes");
      return [];
    }
  },
  async activate(slug: string): Promise<ThemeActivateResponse> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.activateTheme(id, { slug });
      if (result.success) {
        toast.success(`Theme "${slug}" activated successfully`);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Theme activation failed";
      toast.error(message);
      throw err;
    }
  },
  async upload(file: File): Promise<ThemeInstallResponse> {
    try {
      const id = await getFirstWebsiteId();
      const formData = new FormData();
      formData.append("theme_file", file, file.name);
      const result = await websiteApi.uploadTheme(id, formData);
      if (result.success) {
        toast.success(result.message || "Theme installed successfully");
      } else {
        toast.error(result.message || "Theme installation failed");
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Theme upload failed";
      toast.error(message);
      throw err;
    }
  },
  async delete(slug: string): Promise<ThemeDeleteResponse> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.deleteTheme(id, slug);
      if (result.success) {
        toast.success(`Theme "${slug}" deleted successfully`);
      } else {
        toast.error(result.message || "Theme deletion failed");
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Theme deletion failed";
      toast.error(message);
      throw err;
    }
  },
  async update(slug: string): Promise<ThemeUpdateResponse> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.updateTheme(id, { slug });
      if (result.success) {
        toast.success(`Theme "${slug}" updated successfully`);
      } else {
        toast.error(result.message || "Theme update failed");
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Theme update failed";
      toast.error(message);
      throw err;
    }
  },
  async getDetails(slug: string): Promise<ThemeDetail> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getTheme(id, slug);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load theme details";
      toast.error(message);
      throw err;
    }
  },
};

export const pluginService = {
  async list(): Promise<Plugin[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.listPlugins(id);
    } catch (err) {
      toast.error("Failed to load plugins");
      return [];
    }
  },
  async getDetails(slug: string): Promise<PluginDetail> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getPlugin(id, slug);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load plugin details";
      toast.error(message);
      throw err;
    }
  },
  async activate(slug: string): Promise<PluginOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.activatePlugin(id, slug);
      if (result.success) {
        toast.success(`Plugin "${slug}" activated`);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plugin activation failed";
      toast.error(message);
      throw err;
    }
  },
  async deactivate(slug: string): Promise<PluginOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.deactivatePlugin(id, slug);
      if (result.success) {
        toast.success(`Plugin "${slug}" deactivated`);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plugin deactivation failed";
      toast.error(message);
      throw err;
    }
  },
  async delete(slug: string): Promise<PluginOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.deletePlugin(id, slug);
      if (result.success) {
        toast.success(`Plugin "${slug}" deleted`);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plugin deletion failed";
      toast.error(message);
      throw err;
    }
  },
  async update(slug: string): Promise<PluginOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.updatePlugin(id, slug);
      if (result.success) {
        toast.success(`Plugin "${slug}" updated`);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plugin update failed";
      toast.error(message);
      throw err;
    }
  },
  async installFromRepo(slug: string): Promise<PluginOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.installPluginFromRepo(id, slug);
      if (result.success) {
        toast.success(`Plugin "${slug}" installed from repository`);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plugin installation failed";
      toast.error(message);
      throw err;
    }
  },
  async upload(file: File): Promise<PluginOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const formData = new FormData();
      formData.append("plugin_file", file, file.name);
      const result = await websiteApi.uploadPlugin(id, formData);
      if (result.success) {
        toast.success(result.message || "Plugin installed successfully");
      } else {
        toast.error(result.message || "Plugin upload failed");
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plugin upload failed";
      toast.error(message);
      throw err;
    }
  },
  async rollback(slug: string, version: string): Promise<PluginOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.rollbackPlugin(id, slug, version);
      if (result.success) {
        toast.success(`Plugin "${slug}" rolled back to version ${version}`);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plugin rollback failed";
      toast.error(message);
      throw err;
    }
  },
  async toggleAutoUpdate(slug: string, enabled: boolean): Promise<PluginOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.setPluginAutoUpdate(id, slug, enabled);
      if (result.success) {
        toast.success(`Auto-update ${enabled ? "enabled" : "disabled"} for "${slug}"`);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Auto-update toggle failed";
      toast.error(message);
      throw err;
    }
  },
  async search(query: string, perPage = 10, page = 1): Promise<PluginSearchResponse> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.searchPlugins(id, query, perPage, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Plugin search failed";
      toast.error(message);
      throw err;
    }
  },
  async getHealth(): Promise<PluginHealth> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getPluginsHealth(id);
    } catch (err) {
      throw err;
    }
  },
  async getSecurity(): Promise<PluginSecurityIssue[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getPluginsSecurity(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Security check failed";
      toast.error(message);
      throw err;
    }
  },
  async getLogs(limit = 50): Promise<PluginLog[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getPluginLogs(id, limit);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load plugin logs";
      toast.error(message);
      throw err;
    }
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
  async list(): Promise<FormManagerForm[]> {
    try {
      const id = await getFirstWebsiteId();
      const data = await websiteApi.listForms(id);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },
  async get(formId: string): Promise<FormManagerForm> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getForm(id, formId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load form";
      toast.error(message);
      throw err;
    }
  },
  async delete(formId: string): Promise<FormOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.deleteForm(id, formId);
      if (result.success) {
        toast.success(result.message || "Form deleted successfully");
      } else {
        toast.error(result.message || "Form deletion failed");
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Form deletion failed";
      toast.error(message);
      throw err;
    }
  },
  async publish(formId: string): Promise<FormOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.publishForm(id, formId);
      if (result.success) {
        toast.success(result.message || "Form published");
      } else {
        toast.error(result.message || "Publish failed");
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      toast.error(message);
      throw err;
    }
  },
  async unpublish(formId: string): Promise<FormOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.unpublishForm(id, formId);
      if (result.success) {
        toast.success(result.message || "Form unpublished");
      } else {
        toast.error(result.message || "Unpublish failed");
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unpublish failed";
      toast.error(message);
      throw err;
    }
  },
  async duplicate(formId: string): Promise<FormOperationResult> {
    try {
      const id = await getFirstWebsiteId();
      const result = await websiteApi.duplicateForm(id, formId);
      if (result.success) {
        toast.success(result.message || "Form duplicated");
      } else {
        toast.error(result.message || "Duplicate failed");
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Duplicate failed";
      toast.error(message);
      throw err;
    }
  },
  async preview(formId: string): Promise<any> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.previewForm(id, formId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Preview failed";
      toast.error(message);
      throw err;
    }
  },
  async getHealth(): Promise<FormManagerHealth> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getFormsHealth(id);
    } catch {
      throw new Error("Failed to load form health");
    }
  },
  async getLogs(limit = 50): Promise<FormLog[]> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getFormLogs(id, limit);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load form logs";
      toast.error(message);
      throw err;
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
  async inventory(): Promise<ComponentInventory> {
    try {
      const id = await getFirstWebsiteId();
      return await websiteApi.getInventory(id);
    } catch {
      return {
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
    }
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
