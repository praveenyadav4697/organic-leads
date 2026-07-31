import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw, Shield, Server, Cpu, HardDrive, Camera, Globe, Rocket, Plus, Pencil, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { StatCard } from "@/modules/website-foundation/components/stat-cards";
import { websiteApi } from "@/api/websiteApi";
import type { WebsiteRegistrationResponse } from "@/types/website";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/website-foundation/overview")({
  head: () => ({ meta: [{ title: "Website Overview — Nebula" }] }),
  component: WebsiteOverview,
});

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function resolveApiUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_BASE}${url}`;
}

function WebsiteOverview() {
  const [sites, setSites] = useState<WebsiteRegistrationResponse[]>([]);
  const [site, setSite] = useState<WebsiteRegistrationResponse | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotCapturing, setScreenshotCapturing] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [scanRefreshing, setScanRefreshing] = useState(false);

  useEffect(() => {
    websiteApi.list()
      .then((res) => {
        const items = res.items ?? [];
        setSites(items);
        if (items.length > 0) {
          setSite(items[0]);
        } else {
          setSite(null);
        }
      })
      .catch(() => {
        setSites([]);
        setSite(null);
      });
  }, []);

  useEffect(() => {
    if (!site) return;
    setScreenshotUrl(null);
    setScreenshotError(null);
    websiteApi.getScreenshot(site.id)
      .then((data) => {
        const url = resolveApiUrl(data?.url);
        if (url) {
          setScreenshotUrl(url);
        } else if (data && data.status === "failed") {
          setScreenshotError(data.error_message || "Previous capture failed");
        }
      })
      .catch((error) => {
        setScreenshotUrl(null);
        setScreenshotError(error instanceof Error ? error.message : "Failed to load screenshot");
      });
  }, [site]);

  const handleRecapture = async () => {
    if (!site) return;
    setScreenshotCapturing(true);
    setScreenshotError(null);
    try {
      const data = await websiteApi.captureScreenshot(site.id);
      const url = resolveApiUrl(data?.url);
      if (url) {
        setScreenshotUrl(`${url}?t=${Date.now()}`);
        toast.success("Screenshot re-captured");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to capture screenshot";
      setScreenshotError(message);
      toast.error(message);
    } finally {
      setScreenshotCapturing(false);
    }
  };

  const handleRefresh = async () => {
    if (!site) return;
    setScanRefreshing(true);
    try {
      await websiteApi.runDiagnostics(site.id, true);
      setSite(await websiteApi.get(site.id));
      toast.success("Live website diagnostics updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Live scan failed");
    } finally {
      setScanRefreshing(false);
    }
  };

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="size-16 rounded-2xl bg-muted/40 grid place-items-center mb-4">
          <Globe className="size-8 text-muted-foreground" />
        </div>
        <div className="text-lg font-semibold mb-2">No websites registered</div>
        <div className="text-sm text-muted-foreground mb-6">Add your first website to get started with monitoring and auditing.</div>
        <Button className="rounded-xl gradient-primary text-white border-0" onClick={() => {}}>
          <Plus className="size-4" /> Add website
        </Button>
      </div>
    );
  }

  return (
    <div>
      {sites.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="text-sm text-muted-foreground self-center mr-2">
            {sites.length} websites registered
          </div>
          {sites.map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={site?.id === item.id ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSite(item)}
            >
              {item.name}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Health" value={site.health} unit="%" delta={2.4} hint="All systems nominal" icon={Shield} intent="success" index={0} />
        <StatCard label="Performance" value={site.performance} unit="%" delta={1.8} hint="LCP 1.4s" icon={Rocket} intent="primary" index={1} />
        <StatCard label="SEO" value={site.seo} unit="%" delta={5.1} hint="3 quick wins available" icon={Globe} intent="info" index={2} />
        <StatCard label="Responsive" value={site.responsive} unit="%" delta={0.4} hint="Fully responsive" icon={Camera} intent="primary" index={3} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl gradient-primary grid place-items-center text-white">
                <Globe className="size-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{site.name}</div>
                <div className="text-xs text-muted-foreground">{site.url} · {site.cms}</div>
              </div>
            </div>
            <StatusBadge status={site.health > 85 ? "good" : "warn"} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {[
              { l: "Environment", v: site.environment, intent: "primary" as const },
              { l: "Status", v: site.status, intent: site.status === "online" ? "success" as const : "warning" as const },
              { l: "Last scan", v: site.last_scan ? new Date(site.last_scan).toLocaleString() : "Never" },
              { l: "Next scheduled", v: site.next_scan ? new Date(site.next_scan).toLocaleString() : "Not scheduled" },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                <div className="text-sm font-medium mt-0.5 capitalize">{c.v}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" className="rounded-xl h-10" onClick={handleRefresh} disabled={scanRefreshing}>
              <RefreshCw className={`size-4 ${scanRefreshing ? "animate-spin" : ""}`} /> {scanRefreshing ? "Scanning…" : "Refresh live data"}
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-3xl border border-border bg-gradient-to-br from-primary/8 via-card to-accent/8 p-6">
          <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Camera className="size-4 text-primary" /> Website screenshot</div>
          <div className="aspect-video rounded-2xl bg-muted/30 border border-border grid place-items-center relative overflow-hidden">
            {screenshotUrl && !screenshotError ? (
              <img
                src={screenshotUrl}
                alt={`Screenshot of ${site?.url}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 gradient-primary opacity-10" />
            )}
            <div className="relative text-center">
              <div className="text-xs font-semibold">
                {site?.url} · 1440×900
              </div>
              <div className="text-[11px] text-muted-foreground">
                {screenshotCapturing
                  ? "Capturing..."
                  : screenshotUrl
                    ? "Captured just now"
                    : screenshotError
                      ? "Capture failed"
                      : "No screenshot available"}
              </div>
              {screenshotError && (
                <div className="text-[11px] text-destructive mt-1 max-w-[90%] mx-auto line-clamp-2">
                  {screenshotError}
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg mt-3"
                onClick={handleRecapture}
                disabled={screenshotCapturing}
              >
                {screenshotCapturing ? "Capturing..." : screenshotError ? "Retry" : "Re-capture"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Server className="size-4 text-primary" /> Domain & hosting</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { l: "Domain", v: site.domain },
              { l: "Registrar", v: "—" },
              { l: "Hosting", v: site.hosting || "—" },
              { l: "DNS", v: "—" },
              { l: "SSL", v: site.ssl || "—" },
              { l: "WHOIS", v: "—" },
              { l: "Server location", v: "—" },
              { l: "IP", v: "—" },
              { l: "Uptime", v: site.uptime || "—" },
            ].map((c) => (
              <div key={c.l} className="rounded-xl border border-border p-3 bg-muted/30">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                <div className="text-sm font-medium mt-1 truncate">{c.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-sm font-semibold mb-4 flex items-center gap-2"><Cpu className="size-4 text-primary" /> Server resources</div>
          <div className="space-y-3">
            {[
              { l: "Storage usage", v: site.storage },
              { l: "CPU usage", v: site.cpu },
              { l: "Memory usage", v: site.memory },
              { l: "Disk usage", v: site.disk_usage },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex justify-between text-xs mb-1"><span>{m.l}</span><span className="font-semibold">{m.v}%</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.9 }} className="h-full gradient-primary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mb-4">
        <Button variant="outline" className="rounded-xl" onClick={() => toast.info("Editing website")}><Pencil className="size-4" /> Edit</Button>
        <Button variant="outline" className="rounded-xl text-destructive" onClick={() => toast.info("Deleting website")}><Trash2 className="size-4" /> Delete</Button>
      </div>
    </div>
  );
}