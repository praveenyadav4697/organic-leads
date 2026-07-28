import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Server, Database, Globe, Clock, Wrench, ShieldCheck, Languages, FileCode, MemoryStick, HardDrive, Activity, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { wordpressService } from "@/modules/website-foundation/services";
import type { WordPressInfo } from "@/modules/website-foundation/types";
import { Switch } from "@/modules/website-foundation/components/form-field";

export const Route = createFileRoute("/_app/website-foundation/wordpress")({
  head: () => ({ meta: [{ title: "WordPress — Nebula" }] }),
  component: WordPressManagement,
});

function WordPressManagement() {
  const [info, setInfo] = useState<WordPressInfo | null>(null);
  useEffect(() => { wordpressService.get().then(setInfo); }, []);
  if (!info) return <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />;

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
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Toggles</div>
            <Button size="sm" variant="outline" className="rounded-lg">Save</Button>
          </div>
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
              { l: "Memory pressure", v: 41 },
              { l: "CPU average", v: 38 },
              { l: "Cron lag", v: 12 },
            ].map((m) => (
              <div key={m.l}>
                <div className="flex justify-between text-xs mb-1"><span>{m.l}</span><span className="font-semibold">{m.v}%</span></div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${m.v}%` }} transition={{ duration: 0.9 }} className="h-full gradient-primary rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="outline" className="rounded-xl"><RefreshCw className="size-4" /> Sync WordPress</Button>
            <Button className="rounded-xl gradient-primary text-white border-0">Run diagnostics</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
