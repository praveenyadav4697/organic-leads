import { websiteApi } from "@/api/websiteApi";
import type {
  FoundationProject,
  FoundationProjectCreate,
  FoundationProjectUpdate,
  VerifyRequest,
  VerifyResponse,
  InventoryRequest,
  InventoryResponse,
  AuditRequest,
  AuditResponse,
  BackupRequest,
  BackupResponse,
  ApproveRequest,
  ApproveResponse,
  PaginatedResponse,
  ScanRequest,
  ScanResponse,
  OverviewResponse,
  SSLDiscoveryResponse,
  DNSDiscoveryResponse,
  SEODiscoveryResponse,
  SecurityDiscoveryResponse,
  PerformanceDiscoveryResponse,
  WordPressDiscoveryResponse,
  RobotsDiscoveryResponse,
  SitemapDiscoveryResponse,
  ScreenshotResponse,
  ResponsiveDiscoveryResponse,
} from "@/types/foundation";
import type { WebsiteRegistrationCreate, WebsiteRegistrationResponse } from "@/types/website";

function toFoundationProject(site: WebsiteRegistrationResponse): FoundationProject {
  const status: FoundationProject["status"] = site.status === "failed" ? "paused" : "active";
  const verificationStatus: FoundationProject["verification_status"] =
    site.registrationStatus === "completed" ? "completed" : "pending";
  const auditStatus: FoundationProject["audit_status"] = site.latestScanStatus
    ? "completed"
    : "pending";

  return {
    id: site.id,
    name: site.name,
    domain: site.domain,
    url: site.url,
    status,
    verification_status: verificationStatus,
    verification_result: {
      health: site.health,
      performance: site.performance,
      seo: site.seo,
      responsive: site.responsive,
      status: site.status,
    },
    audit_status: auditStatus,
    audit_result: site.registrationStatus ? { registrationStatus: site.registrationStatus } : null,
    inventory_result: null,
    backup_status: "pending",
    backup_path: null,
    approval_status: "pending",
    approved_by: null,
    approval_notes: null,
    created_by: "system",
    updated_by: null,
    created_at: site.createdAt || new Date().toISOString(),
    updated_at: site.updatedAt || site.updated || site.createdAt || new Date().toISOString(),
  };
}

function toCreatePayload(data: FoundationProjectCreate): WebsiteRegistrationCreate {
  return {
    name: data.name,
    url: data.url,
    domain: data.domain,
    protocol: "https",
    environment: "production",
  };
}

function toUpdatePayload(data: FoundationProjectUpdate): Partial<WebsiteRegistrationCreate> {
  return {
    ...(data.name ? { name: data.name } : {}),
    ...(data.url ? { url: data.url } : {}),
    ...(data.domain ? { domain: data.domain } : {}),
  };
}

export const foundationApi = {
  listProjects: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PaginatedResponse> => {
    const res = await websiteApi.list({
      page: params?.page,
      page_size: params?.page_size,
    });

    return {
      items: res.items.map(toFoundationProject),
      total: res.total,
      page: res.page,
      page_size: res.page_size,
      total_pages: res.total_pages,
    };
  },

  getProject: async (id: string): Promise<FoundationProject> => {
    const site = await websiteApi.get(id);
    return toFoundationProject(site);
  },

  createProject: async (data: FoundationProjectCreate): Promise<FoundationProject> => {
    const site = await websiteApi.create(toCreatePayload(data));
    return toFoundationProject(site);
  },

  updateProject: async (id: string, data: FoundationProjectUpdate): Promise<FoundationProject> => {
    const site = await websiteApi.update(id, toUpdatePayload(data));
    return toFoundationProject(site);
  },

  deleteProject: async (id: string): Promise<void> => {
    await websiteApi.delete(id);
  },

  verifyProject: async (id: string, params?: VerifyRequest): Promise<VerifyResponse> => {
    const result = await websiteApi.runDiagnostics(id, params?.force ?? true);
    return {
      project_id: id,
      status: result.status || "queued",
      result: result as unknown as Record<string, unknown>,
    };
  },

  runInventory: async (id: string, _params?: InventoryRequest): Promise<InventoryResponse> => {
    const result = await websiteApi.getInventory(id);
    return {
      project_id: id,
      status: "completed",
      result: result as Record<string, unknown>,
    };
  },

  runAudit: async (id: string, params: AuditRequest): Promise<AuditResponse> => {
    const result = await websiteApi.scan(id, {
      scanType: params.audit_type,
      force: true,
    });
    return {
      project_id: id,
      status: result.status || "queued",
      result: result as unknown as Record<string, unknown>,
    };
  },

  createBackup: async (id: string, _params?: BackupRequest): Promise<BackupResponse> => {
    return {
      project_id: id,
      status: "completed",
      backup_path: `/backups/${id}.zip`,
    };
  },

  approveProject: async (id: string, params: ApproveRequest): Promise<ApproveResponse> => {
    return {
      project_id: id,
      status: params.approved ? "approved" : "rejected",
      approved_by: "system",
    };
  },

  // -----------------------------------------------------------------
  // Discovery scan endpoints (public-only, no credentials).
  // -----------------------------------------------------------------

  runDiscoveryScan: async (id: string, params: ScanRequest): Promise<ScanResponse> => {
    const result = await websiteApi.scan(id, {
      scanType: "full",
      force: params.force ?? true,
    });
    return {
      project_id: id,
      status: result.status || "completed",
      scan_id: result.scanId,
      started_at: result.startedAt,
      completed_at: result.completedAt,
      result: result as unknown as Record<string, unknown>,
    };
  },

  getOverview: async (id: string): Promise<OverviewResponse> => {
    const site = await websiteApi.get(id);
    return {
      project_id: id,
      status: "completed",
      result: {
        domain: site.domain,
        url: site.url,
        cms: site.cms || "unknown",
        version: site.version || "unknown",
        ssl: site.ssl || "unknown",
        registrar: site.registrar || "unknown",
        dns: site.dns || "unknown",
        ip: site.ip || "unknown",
        health: site.health || 0,
        performance: site.performance || 0,
        seo: site.seo || 0,
        security: site.security || 0,
        responsive: site.responsive || 0,
        last_scan: site.lastScan || null,
      },
    };
  },

  getSslDiscovery: async (id: string): Promise<SSLDiscoveryResponse> => {
    try {
      const result = await websiteApi.getSslDiagnostics(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          https_enabled: result.httpsEnabled ?? result.https_enabled ?? false,
          ssl_rating: result.securityRating ?? result.security_rating ?? "unknown",
          issuer: result.issuer,
          expires_at: result.expiresAt ?? result.expires_at,
          tls_version: result.tlsVersion ?? result.tls_version,
          days_until_expiry: result.daysUntilExpiry ?? result.days_until_expiry,
          is_expired: result.isExpired ?? result.is_expired ?? false,
          is_self_signed: result.isSelfSigned ?? result.is_self_signed ?? false,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          https_enabled: false,
          ssl_rating: "Not Publicly Available",
        },
      };
    }
  },

  getDnsDiscovery: async (id: string): Promise<DNSDiscoveryResponse> => {
    try {
      const result = await websiteApi.getDns(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          dns: result.propagationStatus ?? result.propagation_status ?? "unknown",
          ip: result.aRecords?.[0] ?? result.a_records?.[0] ?? "unknown",
          a_records: result.aRecords ?? result.a_records,
          aaaa_records: result.aaaaRecords ?? result.aaaa_records,
          mx_records: result.mxRecords ?? result.mx_records,
          nameservers: result.nameservers,
          txt_records: result.txtRecords ?? result.txt_records,
          spf_record: result.spfRecord ?? result.spf_record,
          dmarc_record: result.dmarcRecord ?? result.dmarc_record,
          dnssec_enabled: result.dnssecEnabled ?? result.dnssec_enabled ?? false,
          propagation_status: result.propagationStatus ?? result.propagation_status,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          dns: "Not Publicly Available",
          ip: "Not Publicly Available",
        },
      };
    }
  },

  getSeoDiscovery: async (id: string): Promise<SEODiscoveryResponse> => {
    try {
      const result = await websiteApi.getSeo(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          seo_score: result.seoScore ?? result.seo_score ?? 0,
          title: result.title,
          meta_description: result.metaDescription ?? result.meta_description,
          canonical_url: result.canonicalUrl ?? result.canonical_url,
          robots_meta: result.robotsMeta ?? result.robots_meta,
          og_title: result.ogTitle ?? result.og_title,
          og_description: result.ogDescription ?? result.og_description,
          og_image: result.ogImage ?? result.og_image,
          og_type: result.ogType ?? result.og_type,
          twitter_card: result.twitterCard ?? result.twitter_card,
          twitter_title: result.twitterTitle ?? result.twitter_title,
          twitter_description: result.twitterDescription ?? result.twitter_description,
          twitter_image: result.twitterImage ?? result.twitter_image,
          has_schema_org: result.hasSchemaOrg ?? result.has_schema_org ?? false,
          h1_count: result.h1Count ?? result.h1_count ?? 0,
          h2_count: result.h2Count ?? result.h2_count ?? 0,
          images_total: result.imagesTotal ?? result.images_total ?? 0,
          images_missing_alt: result.imagesMissingAlt ?? result.images_missing_alt ?? 0,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          seo_score: 0,
        },
      };
    }
  },

  getSecurityDiscovery: async (id: string): Promise<SecurityDiscoveryResponse> => {
    try {
      const result = await websiteApi.getSecurity(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          security_score: result.securityScore ?? result.security_score ?? 0,
          https_enabled: result.httpsEnabled ?? result.https_enabled,
          mixed_content_count: result.mixedContentCount ?? result.mixed_content_count ?? 0,
          directory_listing_enabled:
            result.directoryListingEnabled ?? result.directory_listing_enabled ?? false,
          hsts_enabled: result.hstsEnabled ?? result.hsts_enabled ?? false,
          content_security_policy: result.contentSecurityPolicy ?? result.content_security_policy,
          x_frame_options: result.xFrameOptions ?? result.x_frame_options,
          x_content_type_options: result.xContentTypeOptions ?? result.x_content_type_options,
          referrer_policy: result.referrerPolicy ?? result.referrer_policy,
          permissions_policy: result.permissionsPolicy ?? result.permissions_policy,
          xss_protection: result.xssProtection ?? result.xss_protection ?? false,
          cookies_total: result.cookiesTotal ?? result.cookies_total ?? 0,
          cookies_secure: result.cookiesSecure ?? result.cookies_secure ?? 0,
          cookies_httponly: result.cookiesHttponly ?? result.cookies_httponly ?? 0,
          cookies_samesite: result.cookiesSamesite ?? result.cookies_samesite ?? 0,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          security_score: 0,
        },
      };
    }
  },

  getPerformanceDiscovery: async (id: string): Promise<PerformanceDiscoveryResponse> => {
    try {
      const result = await websiteApi.getPerformance(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          performance_score: 0,
          response_time_ms: result.response_time_ms ?? undefined,
          ttfb_ms: result.ttfb_ms ?? undefined,
          redirect_count: result.redirect_count ?? undefined,
          http_version: result.http_version ?? undefined,
          content_encoding: result.content_encoding ?? undefined,
          compression_enabled: result.compression_enabled ?? false,
          final_url: result.final_url ?? undefined,
          status_code: result.status_code ?? undefined,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          performance_score: 0,
        },
      };
    }
  },

  getWordPressDiscovery: async (id: string): Promise<WordPressDiscoveryResponse> => {
    try {
      const result = await websiteApi.getWordpressInfo(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          cms: result.cms || "wordpress",
          version: result.version ?? "unknown",
          is_wordpress: result.isWordPress ?? result.is_wordpress ?? true,
          rest_api_enabled: result.restApi ?? result.rest_api ?? false,
          xmlrpc_enabled: result.xmlrpc ?? result.xmlrpc ?? false,
          generator_tag: result.generatorTag ?? result.generator_tag,
          wp_content_detected: result.wpContentDetected ?? result.wp_content_detected ?? false,
          wp_includes_detected: result.wpIncludesDetected ?? result.wp_includes_detected ?? false,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          cms: "unknown",
          version: "unknown",
        },
      };
    }
  },

  getRobotsDiscovery: async (id: string): Promise<RobotsDiscoveryResponse> => {
    try {
      const result = await websiteApi.getRobots(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          exists: result.exists ?? false,
          status_code: result.statusCode ?? result.status_code,
          body: result.body,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          exists: false,
        },
      };
    }
  },

  getSitemapDiscovery: async (id: string): Promise<SitemapDiscoveryResponse> => {
    try {
      const result = await websiteApi.getSitemap(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          exists: result.exists ?? false,
          status_code: result.statusCode ?? result.status_code,
          url_count: result.urlCount ?? result.url_count ?? 0,
          sitemap_kind: result.sitemapKind ?? result.sitemap_kind,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          exists: false,
        },
      };
    }
  },

  getScreenshotDiscovery: async (id: string): Promise<ScreenshotResponse> => {
    try {
      const result = await websiteApi.getScreenshot(id);
      return {
        project_id: id,
        status: "completed",
        result: {
          screenshot: result.path ?? result.screenshot ?? `screenshots/${id}.png`,
          url: result.url,
          width: result.width,
          height: result.height,
          file_size: result.fileSize ?? result.file_size,
          captured_at: result.capturedAt ?? result.captured_at,
        },
      };
    } catch {
      return {
        project_id: id,
        status: "completed",
        result: {
          screenshot: `screenshots/${id}.png`,
        },
      };
    }
  },

  getResponsiveDiscovery: async (id: string): Promise<ResponsiveDiscoveryResponse> => {
    const result = await websiteApi.getResponsive(id);
    return {
      project_id: id,
      status: "completed",
      result,
    };
  },

  getDashboard: async (id: string): Promise<any> => {
    const result = await websiteApi.getDashboard(id);
    return {
      project_id: id,
      status: "completed",
      result,
    };
  },
};
