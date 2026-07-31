import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Server, Database, Globe, Clock, Wrench, ShieldCheck, Languages, FileCode, MemoryStick, HardDrive, Activity, RefreshCw, Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { wordpressService } from "@/modules/website-foundation/services";
import { websiteApi } from "@/api/websiteApi";
import type { WordPressInfo } from "@/modules/website-foundation/types";
import { Switch } from "@/modules/website-foundation/components/form-field";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/website-foundation/wordpress")({
  head: () => ({ meta: [{ title: "WordPress | Organic Leads" }] }),
  component: WordPressManagement,
});

function WordPressManagement() {
  const [info, setInfo] = useState<WordPressInfo | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  // The website record returned by the server. The backend now exposes
  // `wpAdminUrl`, `wpUsername`, and `credentialStatus` (and never the
  // password). Everything in this object reflects the authoritative state
  // of the database — not a value the frontend guessed.
  const [website, setWebsite] = useState<
    | {
        id: string;
        wpAdminUrl?: string;
        wpUsername?: string;
        credentialStatus?: "configured" | "missing";
      }
    | null
  >(null);

  const [credentials, setCredentials] = useState({
    wpAdminUrl: "",
    wpUsername: "",
    wpAppPassword: "",
  });

  const refreshWebsite = async () => {
    const w = await websiteApi.list();
    setWebsite(w.items[0] ?? null);
    return w.items[0] ?? null;
  };

  useEffect(() => {
    wordpressService.get().then(setInfo);
    refreshWebsite().then((w) => {
      if (!w) return;
      setCredentials({
        wpAdminUrl: w.wpAdminUrl || "",
        wpUsername: w.wpUsername || "",
        // Password is never returned by the server; leave blank so the
        // user can choose to re-enter or leave it untouched.
        wpAppPassword: "",
      });
    });
  }, []);

  // Server-authoritative credential state. We never trust local-only flags
  // here: the backend computes `credentialStatus` from the database row
  // every time it serializes a WebsiteResponse.
  const hasCredentials = website?.credentialStatus === "configured";

  const handleSaveCredentials = async () => {
    setSaving(true);
    try {
      const id = await getFirstWebsiteId();
      const payload: {
        wpAdminUrl?: string;
        wpUsername?: string;
        wpAppPassword?: string;
      } = {};
      if (credentials.wpAdminUrl) payload.wpAdminUrl = credentials.wpAdminUrl;
      if (credentials.wpUsername) payload.wpUsername = credentials.wpUsername;
      // Only send the password if the user typed a new one. An empty field
      // tells the server to keep the previously stored secret.
      if (credentials.wpAppPassword) payload.wpAppPassword = credentials.wpAppPassword;

      // The PUT response is the freshest server view. Rebuild local state
      // from it instead of issuing a second GET.
      const updated = await websiteApi.update(id, payload);
      setWebsite(updated as typeof website);
      setCredentials({
        wpAdminUrl: updated.wpAdminUrl || "",
        wpUsername: updated.wpUsername || "",
        wpAppPassword: "",
      });
      toast.success("WordPress credentials saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const id = await getFirstWebsiteId();

      // Re-fetch the website so `credentialStatus` reflects the DB, not
      // any stale local state. If the server still says "missing", we
      // surface the real, helpful error message returned by the backend.
      const fresh = await refreshWebsite();
      if (!fresh || fresh.credentialStatus !== "configured") {
        toast.error("WordPress credentials not configured. Please add your WordPress username and application password.");
        setShowCredentials(true);
        return;
      }

      await wordpressService.sync(id);
      toast.success("WordPress data synced successfully");
      const updated = await wordpressService.get();
      setInfo(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (!info) return <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />;

  const needsCredentials = !hasCredentials;

  const items: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; intent?: "primary" | "success" | "warning" }[] = [
    { label: "WordPress version", value: info.version, icon: Server },
    { label: "PHP version", value: info.phpVersion, icon: FileCode },
    { label: "Database version", value: info.databaseVersion, icon: Database },
    { label: "Database engine", value: info.dbEngine, icon: Database },
    { label: "REST API", value: info.restApi ? "Active" : "Inactive", icon: Globe, intent: info.restApi ? "success" : "warning" },
    { label: "Cron", value: info.cron ? "Running" : "Stopped", icon: Clock, intent: info.cron ? "success" : "warning" },
    { label: "XML-RPC", value: info.xmlrpc ? "Enabled" : "Disabled", icon: Wrench, intent: info.xmlrpc ? "warning" : "primary" },
    { label: "Debug mode", value: info.debug ? "On" : "Off", icon: Wrench, intent: info.debug ? "warning" : "primary" },
    { label: "Maintenance mode", value: info.maintenance ? "On" : "Off", icon: Wrench, intent: info.maintenance ? "warning" : "primary" },
    { label: "Automatic updates", value: info.autoUpdates ? "Enabled" : "Disabled", icon: RefreshCw, intent: info.autoUpdates ? "success" : "primary" },
    { label: "Site language", value: info.language, icon: Languages },
    { label: "Timezone", value: info.timezone, icon: Clock },
    { label: "Permalink", value: info.permalink, icon: FileCode },
    { label: "Memory limit", value: info.memoryLimit, icon: MemoryStick, intent: "success" },
    { label: "Disk usage", value: `${info.diskUsage}%`, icon: HardDrive },
    { label: "Server uptime", value: info.uptime, icon: Activity, intent: "success" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">WordPress Configuration</h2>
          <p className="text-sm text-muted-foreground">Real-time data from your WordPress instance</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowCredentials(!showCredentials)}>
            <Save className="size-4" />
            {showCredentials ? "Hide Credentials" : "Configure Credentials"}
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync WordPress"}
          </Button>
        </div>
      </div>

      {showCredentials && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">WordPress Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Admin URL</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="http://localhost:8082"
                value={credentials.wpAdminUrl}
                onChange={(e) => setCredentials({ ...credentials, wpAdminUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Username</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="admin"
                value={credentials.wpUsername}
                onChange={(e) => setCredentials({ ...credentials, wpUsername: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Application Password</label>
              <input
                type="password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="xxxx xxxx xxxx xxxx"
                value={credentials.wpAppPassword}
                onChange={(e) => setCredentials({ ...credentials, wpAppPassword: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveCredentials} disabled={saving}>
              <Save className="size-4 mr-1" />
              {saving ? "Saving..." : "Save Credentials"}
            </Button>
          </div>
        </div>
      )}

      {needsCredentials && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          WordPress credentials not configured. Click "Configure Credentials" to add your WordPress username and application password.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              <it.icon className="size-3.5" /> {it.label}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-base font-semibold">{it.value}</span>
              {it.intent && <Pill intent={it.intent}>{it.intent === "success" ? "Healthy" : it.intent === "warning" ? "Review" : "OK"}</Pill>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Toggles</div>
          <div className="mt-4 space-y-2">
            {[
              { k: "REST API", v: info.restApi },
              { k: "Cron", v: info.cron },
              { k: "XML-RPC", v: info.xmlrpc },
              { k: "Debug mode", v: info.debug },
              { k: "Maintenance mode", v: info.maintenance },
              { k: "Automatic updates", v: info.autoUpdates },
            ].map((t) => (
              <div key={t.k} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="text-sm">{t.k}</div>
                <Switch checked={t.v} onCheckedChange={() => {}} label={t.v ? "On" : "Off"} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Server className="size-4 text-primary" /> System health</div>
          <div className="mt-4 space-y-3">
            {[
              { l: "Disk usage", v: info.diskUsage },
              { l: "Memory pressure", v: Math.min(info.diskUsage, 100) },
              { l: "CPU average", v: 38 },
              { l: "Cron lag", v: 12 },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex justify-between text-xs mb-1"><span>{m.l}</span><span className="font-semibold">{m.v}%</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(m.v, 100)}%` }} transition={{ duration: 0.9 }} className="h-full gradient-primary rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function getFirstWebsiteId(): Promise<string> {
  const res = await websiteApi.list();
  if (res.items.length === 0) throw new Error("No websites registered");
  return res.items[0].id;
}
