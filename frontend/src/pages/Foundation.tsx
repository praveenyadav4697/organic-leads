import { useState } from "react";
import {
  useFoundationProjects,
  useDeleteFoundationProject,
  useVerifyProject,
  useRunAudit,
  useApproveProject,
  useRunDiscoveryScan,
  useOverview,
  useSslDiscovery,
  useDnsDiscovery,
  useSeoDiscovery,
  useSecurityDiscovery,
  usePerformanceDiscovery,
  useWordPressDiscovery,
  useRobotsDiscovery,
  useSitemapDiscovery,
  useScreenshotDiscovery,
} from "@/hooks/useFoundation";
import { ProjectCard } from "@/components/foundation/project-card";
import { ProjectDialog } from "@/components/foundation/project-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, RefreshCw, Play, Shield, Globe, Server, Cpu, Image as ImageIcon, FileText, Lock } from "lucide-react";
import type { FoundationProject } from "@/types/foundation";

function DiscoveryPanel({ projectId }: { projectId: string }) {
  const overview = useOverview(projectId);
  const ssl = useSslDiscovery(projectId);
  const dns = useDnsDiscovery(projectId);
  const seo = useSeoDiscovery(projectId);
  const security = useSecurityDiscovery(projectId);
  const performance = usePerformanceDiscovery(projectId);
  const wordpress = useWordPressDiscovery(projectId);
  const robots = useRobotsDiscovery(projectId);
  const sitemap = useSitemapDiscovery(projectId);
  const screenshot = useScreenshotDiscovery(projectId);

  const sections = [
    {
      title: "SSL",
      icon: Lock,
      data: ssl.data?.result,
      fields: [
        { label: "HTTPS", key: "https_enabled", render: (v: boolean) => (v ? "Enabled" : "Not Publicly Available") },
        { label: "Issuer", key: "issuer", render: (v: string) => v || "Not Publicly Available" },
        { label: "TLS Version", key: "tls_version", render: (v: string) => v || "Not Publicly Available" },
        { label: "Expires", key: "expires_at", render: (v: string) => v ? new Date(v).toLocaleDateString() : "Not Publicly Available" },
        { label: "Days Remaining", key: "days_until_expiry", render: (v: number) => v != null ? `${v} days` : "Not Publicly Available" },
        { label: "Self Signed", key: "is_self_signed", render: (v: boolean) => v ? "Yes" : "No" },
      ],
    },
    {
      title: "DNS",
      icon: Globe,
      data: dns.data?.result,
      fields: [
        { label: "A Records", key: "a_records", render: (v: string[]) => v?.length ? v.join(", ") : "Not Publicly Available" },
        { label: "Nameservers", key: "nameservers", render: (v: string[]) => v?.length ? v.join(", ") : "Not Publicly Available" },
        { label: "MX Records", key: "mx_records", render: (v: string[]) => v?.length ? v.join(", ") : "Not Publicly Available" },
        { label: "SPF", key: "spf_record", render: (v: string) => v || "Not Publicly Available" },
        { label: "DMARC", key: "dmarc_record", render: (v: string) => v || "Not Publicly Available" },
        { label: "DNSSEC", key: "dnssec_enabled", render: (v: boolean) => v ? "Enabled" : "Not Publicly Available" },
      ],
    },
    {
      title: "SEO",
      icon: FileText,
      data: seo.data?.result,
      fields: [
        { label: "Title", key: "title", render: (v: string) => v || "Not Publicly Available" },
        { label: "Meta Description", key: "meta_description", render: (v: string) => v || "Not Publicly Available" },
        { label: "Canonical", key: "canonical_url", render: (v: string) => v || "Not Publicly Available" },
        { label: "OG Title", key: "og_title", render: (v: string) => v || "Not Publicly Available" },
        { label: "Twitter Card", key: "twitter_card", render: (v: string) => v || "Not Publicly Available" },
        { label: "Schema.org", key: "has_schema_org", render: (v: boolean) => v ? "Yes" : "Not Publicly Available" },
        { label: "H1 Count", key: "h1_count", render: (v: number) => v != null ? String(v) : "Not Publicly Available" },
        { label: "Images Missing ALT", key: "images_missing_alt", render: (v: number) => v != null ? String(v) : "Not Publicly Available" },
      ],
    },
    {
      title: "Security",
      icon: Shield,
      data: security.data?.result,
      fields: [
        { label: "Security Score", key: "security_score", render: (v: number) => v != null ? `${v}/100` : "Not Publicly Available" },
        { label: "HSTS", key: "hsts_enabled", render: (v: boolean) => v ? "Enabled" : "Not Publicly Available" },
        { label: "CSP", key: "content_security_policy", render: (v: string) => v || "Not Publicly Available" },
        { label: "X-Frame-Options", key: "x_frame_options", render: (v: string) => v || "Not Publicly Available" },
        { label: "Mixed Content", key: "mixed_content_count", render: (v: number) => v != null ? `${v} issues` : "Not Publicly Available" },
        { label: "Dir Listing", key: "directory_listing_enabled", render: (v: boolean) => v ? "Enabled" : "Not Publicly Available" },
      ],
    },
    {
      title: "Performance",
      icon: Cpu,
      data: performance.data?.result,
      fields: [
        { label: "Performance Score", key: "performance_score", render: (v: number) => v != null ? `${v}/100` : "Not Publicly Available" },
        { label: "Response Time", key: "response_time_ms", render: (v: number) => v != null ? `${v}ms` : "Not Publicly Available" },
        { label: "TTFB", key: "ttfb_ms", render: (v: number) => v != null ? `${v}ms` : "Not Publicly Available" },
        { label: "Compression", key: "compression_enabled", render: (v: boolean) => v ? "Enabled" : "Not Publicly Available" },
        { label: "Redirects", key: "redirect_count", render: (v: number) => v != null ? String(v) : "Not Publicly Available" },
      ],
    },
    {
      title: "WordPress",
      icon: Server,
      data: wordpress.data?.result,
      fields: [
        { label: "CMS", key: "cms", render: (v: string) => v || "Not Publicly Available" },
        { label: "Version", key: "version", render: (v: string) => v || "Not Publicly Available" },
        { label: "REST API", key: "rest_api_enabled", render: (v: boolean) => v ? "Enabled" : "Not Publicly Available" },
        { label: "XML-RPC", key: "xmlrpc_enabled", render: (v: boolean) => v ? "Enabled" : "Not Publicly Available" },
        { label: "wp-content", key: "wp_content_detected", render: (v: boolean) => v ? "Detected" : "Not Publicly Available" },
        { label: "wp-includes", key: "wp_includes_detected", render: (v: boolean) => v ? "Detected" : "Not Publicly Available" },
      ],
    },
    {
      title: "Robots.txt",
      icon: FileText,
      data: robots.data?.result,
      fields: [
        { label: "Exists", key: "exists", render: (v: boolean) => v ? "Yes" : "Not Publicly Available" },
        { label: "Status Code", key: "status_code", render: (v: number) => v != null ? String(v) : "Not Publicly Available" },
      ],
    },
    {
      title: "Sitemap",
      icon: FileText,
      data: sitemap.data?.result,
      fields: [
        { label: "Exists", key: "exists", render: (v: boolean) => v ? "Yes" : "Not Publicly Available" },
        { label: "URL Count", key: "url_count", render: (v: number) => v != null ? String(v) : "Not Publicly Available" },
        { label: "Kind", key: "sitemap_kind", render: (v: string) => v || "Not Publicly Available" },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Discovery Results</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="rounded-lg border p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <section.icon className="size-4" />
              {section.title}
            </h3>
            {section.data && !section.data.error ? (
              <div className="space-y-2 text-xs">
                {section.fields.map((field) => {
                  const value = section.data?.[field.key];
                  return (
                    <div key={field.key} className="flex justify-between">
                      <span className="text-muted-foreground">{field.label}</span>
                      <span className="font-medium text-right max-w-[60%] truncate" title={value != null ? String(value) : "Not Publicly Available"}>
                        {value != null ? field.render(value) : "Not Publicly Available"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Not Publicly Available</p>
            )}
          </div>
        ))}
      </div>
      {screenshot.data?.result && (
        <div className="rounded-lg border p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
            <ImageIcon className="size-4" />
            Screenshot
          </h3>
          {screenshot.data.result.url ? (
            <img src={screenshot.data.result.url} alt="Screenshot" className="max-w-full rounded border" />
          ) : screenshot.data.result.status === "not_available" ? (
            <p className="text-xs text-muted-foreground">Not Publicly Available</p>
          ) : (
            <p className="text-xs text-muted-foreground">Not Publicly Available</p>
          )}
        </div>
      )}
    </div>
  );
}

function FoundationPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<FoundationProject | null>(null);
  const [scanningProject, setScanningProject] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useFoundationProjects({
    page,
    page_size: 10,
    status: statusFilter,
  });

  const deleteProject = useDeleteFoundationProject({
    onSuccess: () => toast.success("Project deleted"),
    onError: () => toast.error("Failed to delete project"),
  });

  const verifyProject = useVerifyProject({
    onSuccess: () => toast.success("Verification started"),
    onError: () => toast.error("Verification failed"),
  });

  const runAudit = useRunAudit({
    onSuccess: () => toast.success("Audit started"),
    onError: () => toast.error("Audit failed"),
  });

  const approveProject = useApproveProject({
    onSuccess: () => toast.success("Approval updated"),
    onError: () => toast.error("Approval failed"),
  });

  const runDiscoveryScan = useRunDiscoveryScan({
    onSuccess: (_, variables) => {
      toast.success("Discovery scan completed");
      setScanningProject(null);
      refetch();
    },
    onError: () => {
      toast.error("Discovery scan failed");
      setScanningProject(null);
    },
  });

  const handleCreate = (data: any) => {
    toast.success("Project created");
    setDialogOpen(false);
    refetch();
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProject.mutate(id);
    }
  };

  const handleVerify = (id: string) => {
    verifyProject.mutate({ id });
  };

  const handleAudit = (id: string) => {
    runAudit.mutate({ id, params: { audit_type: "full" } });
  };

  const handleApprove = (id: string, approved: boolean) => {
    approveProject.mutate({ id, params: { approved, notes: approved ? "Approved via dashboard" : "Rejected via dashboard" } });
  };

  const handleRunScan = (id: string) => {
    setScanningProject(id);
    runDiscoveryScan.mutate({ id, params: { force: true } });
  };

  const filteredProjects = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-destructive mb-4">Failed to load projects</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website Foundation</h1>
          <p className="text-sm text-muted-foreground">
            Manage website foundation projects, run public discovery scans, and view results.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="size-3" /> Refresh
          </Button>
          <ProjectDialog onSubmit={handleCreate}>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="size-3" /> New Project
            </Button>
          </ProjectDialog>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={statusFilter ?? ""}
          onChange={(e) => setStatusFilter(e.target.value || undefined)}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No projects found.</p>
          <p className="text-xs mt-1">Create a new project to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredProjects.length} of {data?.total ?? 0} projects
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="px-2 py-1 text-xs">Page {page} of {data?.total_pages ?? 1}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.total_pages ?? 1)} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedProject(null)}>
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Discovery Results</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>Close</Button>
            </div>
            <div className="flex gap-2 mb-4">
              <Button size="sm" onClick={() => handleRunScan(selectedProject)} disabled={scanningProject === selectedProject}>
                <Play className="size-3 mr-1" /> {scanningProject === selectedProject ? "Scanning..." : "Run Scan"}
              </Button>
            </div>
            <DiscoveryPanel projectId={selectedProject} />
          </div>
        </div>
      )}
    </div>
  );
}

export default FoundationPage;