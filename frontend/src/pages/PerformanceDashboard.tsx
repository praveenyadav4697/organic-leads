import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { websiteApi } from "@/api/websiteApi";
import { websiteService } from "@/modules/website-foundation/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { RefreshCw, Play, Globe, HardDrive, Clock, ToggleLeft } from "lucide-react";
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

function MetricCard({ label, value, target }: { label: string; value: string; target: string }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">{value}</div>
        <div className="text-[11px] text-muted-foreground">Target: {target}</div>
      </CardContent>
    </Card>
  );
}

function EmptyMetric({ label, target }: { label: string; target: string }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold text-muted-foreground">—</div>
        <div className="text-[11px] text-muted-foreground">Target: {target}</div>
      </CardContent>
    </Card>
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
  if (performance.lcp_ms && performance.lcp_ms > 2500) recs.push("Large LCP detected — optimize hero images and server response times.");
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

function TrendPlaceholder() {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm">Core Web Vitals Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center text-xs text-muted-foreground h-40">
          Run additional scans to build trend history. Historical charts appear after multiple audits.
        </div>
      </CardContent>
    </Card>
  );
}

export default function PerformanceDashboard() {
  const [websiteId, setWebsiteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const auditMutation = useMutation({
    mutationFn: () => websiteApi.scan(websiteId!, { scanType: "full", force: true }),
    onSuccess: () => {
      toast.success("Performance scan started");
      queryClient.invalidateQueries({ queryKey: ["website-performance"] });
      refetch();
    },
    onError: () => toast.error("Failed to start scan"),
  });

  const isScanning = auditMutation.isPending;

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader className="pb-2">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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
          <Button size="sm" className="flex items-center gap-1" onClick={() => auditMutation.mutate()} disabled={isScanning}>
            <Play className="size-3" /> {isScanning ? "Scanning..." : "Run Audit"}
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance</h1>
          <p className="text-sm text-muted-foreground">
            Core Web Vitals, page weight, request metrics, and recommendations from the latest audit.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="size-3" /> Refresh
          </Button>
          <Button size="sm" className="flex items-center gap-1" onClick={() => auditMutation.mutate()} disabled={isScanning}>
            <Play className="size-3" /> {isScanning ? "Scanning..." : "Run Audit"}
          </Button>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Core Web Vitals</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {performance.lcp_ms != null ? <MetricCard label="LCP" value={formatMs(performance.lcp_ms)} target="2.5 s" /> : <EmptyMetric label="LCP" target="2.5 s" />}
          {performance.cls != null ? <MetricCard label="CLS" value={performance.cls.toFixed(3)} target="0.1" /> : <EmptyMetric label="CLS" target="0.1" />}
          {performance.inp_ms != null ? <MetricCard label="INP" value={formatMs(performance.inp_ms)} target="200 ms" /> : <EmptyMetric label="INP" target="200 ms" />}
          {performance.fid_ms != null ? <MetricCard label="FID" value={formatMs(performance.fid_ms)} target="100 ms" /> : <EmptyMetric label="FID" target="100 ms" />}
          {performance.fcp_ms != null ? <MetricCard label="FCP" value={formatMs(performance.fcp_ms)} target="1.8 s" /> : <EmptyMetric label="FCP" target="1.8 s" />}
          {performance.speed_index_ms != null ? <MetricCard label="Speed Index" value={formatMs(performance.speed_index_ms)} target="3.4 s" /> : <EmptyMetric label="Speed Index" target="3.4 s" />}
        </div>
      </div>

      {/* Timing */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Timing</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {performance.ttfb_ms != null ? <MetricCard label="TTFB" value={formatMs(performance.ttfb_ms)} target="600 ms" /> : <EmptyMetric label="TTFB" target="600 ms" />}
          {performance.dns_ms != null ? <MetricCard label="DNS" value={formatMs(performance.dns_ms)} target="50 ms" /> : <EmptyMetric label="DNS" target="50 ms" />}
          {performance.tcp_ms != null ? <MetricCard label="TCP" value={formatMs(performance.tcp_ms)} target="100 ms" /> : <EmptyMetric label="TCP" target="100 ms" />}
          {performance.tls_ms != null ? <MetricCard label="TLS" value={formatMs(performance.tls_ms)} target="200 ms" /> : <EmptyMetric label="TLS" target="200 ms" />}
          {performance.request_ms != null ? <MetricCard label="Request" value={formatMs(performance.request_ms)} target="—" /> : <EmptyMetric label="Request" target="—" />}
          {performance.response_ms != null ? <MetricCard label="Response" value={formatMs(performance.response_ms)} target="—" /> : <EmptyMetric label="Response" target="—" />}
          {performance.dom_processing_ms != null ? <MetricCard label="DOM Processing" value={formatMs(performance.dom_processing_ms)} target="—" /> : <EmptyMetric label="DOM Processing" target="—" />}
          {performance.load_event_ms != null ? <MetricCard label="Load Event" value={formatMs(performance.load_event_ms)} target="—" /> : <EmptyMetric label="Load Event" target="—" />}
        </div>
      </div>

      {/* Page Size & Requests */}
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
          <KV label="Video" value={`${formatBytes(performance.video_bytes)} (${performance.video_requests ?? "—"})`} />
          <KV label="Audio" value={`${formatBytes(performance.audio_bytes)} (${performance.audio_requests ?? "—"})`} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendPlaceholder />
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="size-4 text-primary" /> Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <Recs performance={performance} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
