import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Camera, Monitor, AlertTriangle, CheckCircle2, Accessibility, RefreshCw, Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { websiteApi } from "@/api/websiteApi";
import { foundationApi } from "@/api/foundationApi";
import { useResponsiveDiscovery } from "@/hooks/useFoundation";
import { useRunDiscoveryScan } from "@/hooks/useFoundation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResponsiveDiscoveryResponse } from "@/types/foundation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/website-foundation/responsive")({
  head: () => ({ meta: [{ title: "Responsive | Organic Leads" }] }),
  component: ResponsiveCenter,
});

function resolveScreenshotUrl(url: string | null | undefined, baseUrl?: string): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
  return `${apiBase}${url}`;
}

function formatBytes(bytes?: number): string {
  if (!bytes && bytes !== 0) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function ResponsiveCenter() {
  const queryClient = useQueryClient();
  const { data: website } = useQuery({
    queryKey: ["website-list"],
    queryFn: () => websiteApi.list(),
    select: (res) => res.items?.[0],
  });

  const websiteId = website?.id;

  const { data: responsive, isLoading: responsiveLoading, isError: responsiveError, refetch: refetchResponsive } =
    useResponsiveDiscovery(websiteId || "");

  const [scanId, setScanId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const { mutate: runScan } = useRunDiscoveryScan();

  const { data: scanStatus } = useQuery({
    queryKey: ["scan-status", websiteId, scanId],
    queryFn: () => websiteApi.getScanStatus(websiteId!, scanId!),
    enabled: !!websiteId && !!scanId,
    refetchInterval: (query) => {
      if (!query.state.data) return 2000;
      if (query.state.data.status === "completed" || query.state.data.status === "failed") {
        return false;
      }
      return 2000;
    },
  });

  const isScanning = useMemo(() => {
    if (!scanStatus) return scanning;
    return scanStatus.status === "running" || scanStatus.status === "queued";
  }, [scanStatus, scanning]);

  if (scanStatus && (scanStatus.status === "completed" || scanStatus.status === "failed")) {
    setScanning(false);
    setScanId(null);
    queryClient.invalidateQueries({ queryKey: ["website-list"] });
    queryClient.invalidateQueries({ queryKey: ["foundation-responsive"] });
    queryClient.invalidateQueries({ queryKey: ["foundation-screenshot"] });
    queryClient.invalidateQueries({ queryKey: ["scan-status"] });
    if (scanStatus.status === "completed") {
      toast.success("Responsive audit updated");
    } else if (scanStatus.error_message) {
      toast.error(scanStatus.error_message);
    }
  }

  const handleRunAudit = () => {
    if (!websiteId) return;
    setScanning(true);
    runScan(
      { id: websiteId, params: { force: true } },
      {
        onSuccess: (data: any) => {
          const sid = data.scan_id;
          if (sid) setScanId(sid);
          else {
            setScanning(false);
            toast.error("Scan failed to start");
          }
        },
        onError: (error: unknown) => {
          setScanning(false);
          toast.error(error instanceof Error ? error.message : "Scan failed");
        },
      }
    );
  };

  const isLoading = responsiveLoading || isScanning;
  const hasData = responsive && responsive.status !== "not_available";

  const viewportInfo = useMemo(() => {
    if (!responsive?.result) return null;
    const vm = responsive.result.viewport_meta || "";
    const hasTag = responsive.result.has_responsive_tag;
    if (hasTag && vm) return vm;
    if (hasTag) return "Responsive viewport detected";
    if (vm) return vm;
    return "No viewport meta tag detected";
  }, [responsive]);

  const screenshotUrl = useMemo(
    () => resolveScreenshotUrl(responsive?.result?.screenshot_url, website?.url),
    [responsive?.result?.screenshot_url, website?.url]
  );

  if (responsiveError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Responsive</h1>
            <p className="text-sm text-muted-foreground">Mobile readiness, viewports, touch targets</p>
          </div>
        </div>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive flex items-center justify-between">
          <span>Failed to load responsive data — the backend may be unreachable.</span>
          <Button variant="outline" size="sm" onClick={() => refetchResponsive()}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Responsive</h1>
          <p className="text-sm text-muted-foreground">
            {website?.url
              ? `${website.url} · Mobile readiness, viewports, touch targets`
              : "Mobile readiness, viewports, touch targets"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["foundation-responsive"] });
              queryClient.invalidateQueries({ queryKey: ["foundation-screenshot"] });
              queryClient.invalidateQueries({ queryKey: ["website-list"] });
              toast.success("Refreshed");
            }}
            disabled={isScanning}
          >
            <RefreshCw className={cn("size-4", isScanning && "animate-spin")} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleRunAudit} disabled={isScanning || !websiteId}>
            <Play className="size-3.5" /> {isScanning ? "Running Audit…" : "Run Audit"}
          </Button>
        </div>
      </div>

      {isScanning && (
        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <RefreshCw className="size-4 animate-spin text-primary" />
          <div>
            <div className="text-sm font-semibold">Audit in progress</div>
            <div className="text-xs text-muted-foreground">
              {scanStatus?.status === "queued" ? "Queued" : scanStatus?.status === "running" ? "Scanning…" : "Starting…"}
            </div>
          </div>
        </div>
      )}

      {!hasData && !isLoading && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <Monitor className="size-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold mb-1">No responsive audit has been executed yet.</p>
          <p className="text-xs text-muted-foreground mb-4">Run an audit to capture viewport, touch targets, and responsive metrics.</p>
          <Button size="sm" onClick={handleRunAudit} disabled={!websiteId || isScanning}>
            <Play className="size-3.5" /> Run Audit
          </Button>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold flex items-center gap-2"><Monitor className="size-4 text-primary" /> Viewport & score</div>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Responsive Score</div>
                <div className="text-sm font-medium mt-0.5">{responsive.result.responsive_score ?? "—"} / 100</div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Viewport Meta</div>
                <div className="text-sm font-medium mt-0.5 break-all">{viewportInfo || "Not available"}</div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Responsive Tag</div>
                <div className="text-sm font-medium mt-0.5 capitalize">
                  {responsive.result.has_responsive_tag !== undefined ? (responsive.result.has_responsive_tag ? "Detected" : "Missing") : "Not available"}
                </div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Accessibility</div>
                <div className="text-sm font-medium mt-0.5">
                  {responsive.result.accessibility_score !== undefined && responsive.result.accessibility_score !== null
                    ? `${responsive.result.accessibility_score} / 100`
                    : "Not available"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="size-4 text-warning" /> Responsive issues</div>
            <div className="mt-4 space-y-2">
              {(responsive.result.errors && responsive.result.errors.length > 0) ? (
                responsive.result.errors.map((err, idx) => (
                  <div key={idx} className="rounded-xl border border-border p-3 bg-muted/20">
                    <div className="text-sm font-medium">{err}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 capitalize">scan error</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-border p-3 bg-muted/20">
                  <div className="text-sm font-medium">No responsive issues detected</div>
                  <div className="text-xs text-muted-foreground mt-0.5">All viewports passed</div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold flex items-center gap-2"><Accessibility className="size-4 text-primary" /> Touch targets</div>
            <div className="mt-4">
              <div className="rounded-xl border border-border p-3 bg-muted/20 text-center">
                <div className="text-xs text-muted-foreground">Touch target analysis</div>
                <div className="text-sm font-medium mt-1">Not available from public scan</div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Detailed touch target measurements require authenticated inspection.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-sm font-semibold flex items-center gap-2"><CheckCircle2 className="size-4 text-success" /> Snapshot</div>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Captured</div>
                <div className="text-sm font-medium mt-0.5">
                  {responsive.result.scanned_at ? new Date(responsive.result.scanned_at).toLocaleString() : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Resolution</div>
                <div className="text-sm font-medium mt-0.5">
                  {responsive.result.screenshot_width && responsive.result.screenshot_height
                    ? `${responsive.result.screenshot_width}×${responsive.result.screenshot_height}`
                    : "—"}
                </div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Viewport</div>
                <div className="text-sm font-medium mt-0.5">{viewportInfo || "—"}</div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Navigation</div>
                <div className="text-sm font-medium mt-0.5">Not available from public scan</div>
              </div>
              <div className="rounded-xl border border-border p-3 bg-muted/20">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Accessibility</div>
                <div className="text-sm font-medium mt-0.5">
                  {responsive.result.accessibility_score !== undefined && responsive.result.accessibility_score !== null
                    ? `${responsive.result.accessibility_score} / 100`
                    : "Not available"}
                </div>
              </div>
            </div>
            {screenshotUrl && (
              <div className="mt-4">
                <div className="rounded-xl border border-border overflow-hidden bg-muted/30 relative" style={{ aspectRatio: "16 / 9" }}>
                  <img
                    src={screenshotUrl}
                    alt={`Screenshot of ${website?.url || responsive.result.url}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {formatBytes(responsive.result.screenshot_file_size)} · {responsive.result.screenshot_width}×{responsive.result.screenshot_height}
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ExternalLink className="size-3.5" /> Open
                  </Button>
                </div>
              </div>
            )}
            {responsive.result.screenshot_status === "failed" && (
              <div className="mt-4 rounded-xl border border-border bg-destructive/10 p-3">
                <div className="text-xs font-semibold text-destructive">Screenshot Capture Failed</div>
                <div className="text-[11px] text-destructive/80 mt-0.5">{responsive.result.screenshot_error || "Unknown error"}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg mt-2 w-full"
                  onClick={async () => {
                    if (!websiteId) return;
                    try {
                      await websiteApi.captureScreenshot(websiteId);
                      queryClient.invalidateQueries({ queryKey: ["foundation-responsive"] });
                      queryClient.invalidateQueries({ queryKey: ["foundation-screenshot"] });
                      toast.success("Screenshot re-captured");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to capture screenshot");
                    }
                  }}
                >
                  <Camera className="size-3.5" /> Retry Screenshot
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResponsiveCenter;
