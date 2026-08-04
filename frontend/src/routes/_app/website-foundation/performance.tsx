import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Zap, Image as ImageIcon, FileCode, Database, Globe, Sparkles, RefreshCw, Play, HardDrive, Clock, ToggleLeft } from "lucide-react";
import { websiteApi } from "@/api/websiteApi";
import { websiteService } from "@/modules/website-foundation/services";
import { VitalsRing } from "@/modules/website-foundation/components/vitals-ring";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { WebsitePerformance } from "@/types/website";

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function MetricPlaceholder({ label, unit, target }: { label: string; unit: string; target: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <div className="text-xl font-semibold text-muted-foreground">—</div>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-[11px] text-muted-foreground">Target ≤ {target}{unit}</div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function Recs({ performance }: { performance: WebsitePerformance }) {
  const recs: string[] = [];
  if (performance.lcp_ms && performance.lcp_ms > 2500) recs.push("Large LCP — optimize hero images and server response times.");
  if (performance.cls && performance.cls > 0.1) recs.push("Layout shift above threshold — reserve space for images and embeds.");
  if (performance.inp_ms && performance.inp_ms > 200) recs.push("High INP — reduce long-running JavaScript tasks on interaction.");
  if (performance.fid_ms && performance.fid_ms > 100) recs.push("High FID — minimize long-running JavaScript during first input.");
  if (performance.ttfb_ms && performance.ttfb_ms > 600) recs.push("Slow TTFB — review server-side caching, CDN, and database queries.");
  if (!performance.compression_enabled) recs.push("Missing compression — enable Brotli or Gzip at the edge.");
  if (performance.page_size_bytes && performance.page_size_bytes > 2 * 1024 * 1024) recs.push("Page size exceeds 2 MB — tree-shake JavaScript and compress assets.");
  if (performance.request_count && performance.request_count > 80) recs.push("High request count — consolidate and reduce third-party scripts.");
  if (performance.js_bytes && performance.js_bytes > 512 * 1024) recs.push("Large JavaScript bundles — code-split and defer non-critical scripts.");
  if (performance.css_bytes && performance.css_bytes > 128 * 1024) recs.push("Large CSS — purge unused selectors and inline critical styles.");
  if (performance.image_bytes && performance.image_bytes > 512 * 1024) recs.push("Heavy image payload — serve WebP/AVIF, lazy-load offscreen images.");
  if (performance.third_party_requests && performance.third_party_requests > 10) recs.push("Too many third-party requests — audit analytics, ads, and trackers.");
  if (performance.fcp_ms && performance.fcp_ms > 1800) recs.push("Slow FCP — eliminate render-blocking resources and optimize critical path.");

  if (recs.length === 0) {
    return <p className="text-xs text-muted-foreground">No recommendations — this scan looks healthy.</p>;
  }

  return (
    <ul className="space-y-2">
      {recs.map((r) => (
        <li key={r} className="text-xs rounded-lg border border-border p-2">{r}</li>
      ))}
    </ul>
  );
}

import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";

export const Route = createFileRoute("/_app/website-foundation/performance")({
  head: () => ({ meta: [{ title: "Performance | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Performance">
      <PerformanceCenter />
    </ErrorBoundary>
  ),
});

function PerformanceCenter() {
  const [websiteId, setWebsiteId] = useState<string | null>(null);

  useEffect(() => {
    websiteService.list().then((sites) => {
      if (sites.length > 0) setWebsiteId(sites[0].id);
    });
  }, []);

  const { data: performance, isLoading, isError, refetch } = useQuery<WebsitePerformance>({
    queryKey: ["website-performance", websiteId],
    queryFn: () => websiteApi.getPerformance(websiteId!),
    enabled: !!websiteId,
    retry: false,
  });

  if (!websiteId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm font-medium text-foreground">No website registered</p>
          <p className="text-xs mt-1 text-muted-foreground">Register a website to view performance metrics.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />;

  const isUnavailable = performance?.not_publicly_available;
  const metricValues = performance
    ? Object.entries(performance)
        .filter(([k]) => k !== "not_publicly_available")
        .map(([, v]) => v)
    : [];
  const isEmpty = !performance || (isUnavailable && !metricValues.some((v) => v !== null && v !== false));

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive flex items-center justify-between">
          <span>Failed to load performance data — the backend may be unreachable.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
          <Button size="sm" className="flex items-center gap-1" onClick={() => websiteApi.scan(websiteId, { scanType: "full", force: true }).then(() => { toast.success("Scan started"); refetch(); })}>
            <Play className="size-3" /> Run Audit
          </Button>
        </div>
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm font-medium text-foreground">Not Yet Scanned</p>
          <p className="text-xs mt-1 text-muted-foreground">Run an audit to collect Core Web Vitals and page metrics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1">
          <RefreshCw className="size-3" /> Refresh
        </Button>
      </div>

      {/* Core Web Vitals */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Core Web Vitals</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {performance.lcp_ms != null ? (
            <VitalsRing label="LCP" value={performance.lcp_ms / 1000} target={2.5} unit="s" intent="success" />
          ) : (
            <MetricPlaceholder label="LCP" unit="s" target={2.5} />
          )}
          {performance.cls != null ? (
            <VitalsRing label="CLS" value={performance.cls} target={0.1} unit="" intent="success" />
          ) : (
            <MetricPlaceholder label="CLS" unit="" target={0.1} />
          )}
          {performance.inp_ms != null ? (
            <VitalsRing label="INP" value={performance.inp_ms} target={200} unit="ms" intent="warning" />
          ) : (
            <MetricPlaceholder label="INP" unit="ms" target={200} />
          )}
          {performance.fid_ms != null ? (
            <VitalsRing label="FID" value={performance.fid_ms} target={100} unit="ms" intent="success" />
          ) : (
            <MetricPlaceholder label="FID" unit="ms" target={100} />
          )}
          {performance.fcp_ms != null ? (
            <VitalsRing label="FCP" value={performance.fcp_ms} target={1800} unit="ms" intent="success" />
          ) : (
            <MetricPlaceholder label="FCP" unit="ms" target={1800} />
          )}
          {performance.speed_index_ms != null ? (
            <VitalsRing label="Speed Index" value={performance.speed_index_ms / 1000} target={3.4} unit="s" intent="success" />
          ) : (
            <MetricPlaceholder label="Speed Index" unit="s" target={3.4} />
          )}
        </div>
      </div>

      {/* Timing */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Timing</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {performance.ttfb_ms != null ? (
            <VitalsRing label="TTFB" value={performance.ttfb_ms} target={600} unit="ms" intent="success" />
          ) : (
            <MetricPlaceholder label="TTFB" unit="ms" target={600} />
          )}
          {performance.dns_ms != null ? (
            <VitalsRing label="DNS" value={performance.dns_ms} target={50} unit="ms" intent="success" />
          ) : (
            <MetricPlaceholder label="DNS" unit="ms" target={50} />
          )}
          {performance.tcp_ms != null ? (
            <VitalsRing label="TCP" value={performance.tcp_ms} target={100} unit="ms" intent="success" />
          ) : (
            <MetricPlaceholder label="TCP" unit="ms" target={100} />
          )}
          {performance.tls_ms != null ? (
            <VitalsRing label="TLS" value={performance.tls_ms} target={200} unit="ms" intent="success" />
          ) : (
            <MetricPlaceholder label="TLS" unit="ms" target={200} />
          )}
          {performance.request_ms != null ? (
            <VitalsRing label="Request" value={performance.request_ms} target={100} unit="ms" intent="success" />
          ) : (
            <MetricPlaceholder label="Request" unit="ms" target={100} />
          )}
          {performance.response_ms != null ? (
            <VitalsRing label="Response" value={performance.response_ms} target={500} unit="ms" intent="success" />
          ) : (
            <MetricPlaceholder label="Response" unit="ms" target={500} />
          )}
        </div>
      </div>

      {/* Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><HardDrive className="size-4 text-primary" /> Page Size</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <KV label="Total" value={formatBytes(performance.page_size_bytes)} />
            <KV label="Encoded" value={formatBytes(performance.page_encoded_bytes)} />
            <KV label="Decoded" value={formatBytes(performance.page_decoded_bytes)} />
            <KV label="Requests" value={performance.request_count?.toString() ?? "—"} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Globe className="size-4 text-primary" /> Requests</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <KV label="JavaScript" value={`${formatBytes(performance.js_bytes)} (${performance.js_requests ?? "—"})`} />
            <KV label="CSS" value={`${formatBytes(performance.css_bytes)} (${performance.css_requests ?? "—"})`} />
            <KV label="Images" value={`${formatBytes(performance.image_bytes)} (${performance.image_requests ?? "—"})`} />
            <KV label="Fonts" value={`${formatBytes(performance.font_bytes)} (${performance.font_requests ?? "—"})`} />
            <KV label="XHR / Fetch" value={`${formatBytes(performance.xhr_fetch_bytes)} (${performance.xhr_fetch_requests ?? "—"})`} />
            <KV label="Other" value={`${formatBytes(performance.other_bytes)} (${performance.other_requests ?? "—"})`} />
            <KV label="Third-party" value={`${formatBytes(performance.third_party_bytes)} (${performance.third_party_requests ?? "—"})`} />
          </CardContent>
        </Card>
      </div>

      {/* Network & Compression */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><ToggleLeft className="size-4 text-primary" /> Network &amp; Compression</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <KV label="HTTP Version" value={performance.http_version ?? "—"} />
          <KV label="Compression" value={performance.compression_enabled ? "Enabled" : "Disabled"} />
          <KV label="Encoding" value={performance.content_encoding ?? "—"} />
          <KV label="Redirects" value={performance.redirect_count?.toString() ?? "—"} />
          <KV label="HTTP Status" value={performance.status_code?.toString() ?? "—"} />
          <KV label="Final URL" value={performance.final_url ?? "—"} />
        </CardContent>
      </Card>

      {/* Trend + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Zap className="size-4 text-primary" /> Core Web Vitals trend</div>
          <div className="mt-4 flex items-center justify-center text-xs text-muted-foreground">
            Historical chart requires multiple scan records. Run audits over time to visualize trends.
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Recommendations</div>
          <div className="mt-3 space-y-2">
            <Recs performance={performance} />
          </div>
        </div>
      </div>
    </div>
  );
}
