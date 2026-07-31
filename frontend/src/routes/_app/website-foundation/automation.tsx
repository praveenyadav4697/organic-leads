import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, X, Bot, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jobService } from "@/modules/website-foundation/services";
import type { AutomationJob } from "@/modules/website-foundation/types";
import { Pill } from "@/modules/website-foundation/components/status-pill";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/website-foundation/automation")({
  head: () => ({ meta: [{ title: "Automation Jobs | Organic Leads" }] }),
  component: AutomationJobs,
});

function AutomationJobs() {
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  useEffect(() => { jobService.list().then(setJobs); }, []);

  const queue = jobs.filter((j) => j.state === "queued").length;
  const running = jobs.filter((j) => j.state === "running").length;
  const completed = jobs.filter((j) => j.state === "completed").length;
  const failed = jobs.filter((j) => j.state === "failed").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Queued", v: queue, intent: "info" as const },
          { l: "Running", v: running, intent: "primary" as const },
          { l: "Completed", v: completed, intent: "success" as const },
          { l: "Failed", v: failed, intent: "danger" as const },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
            <div className="mt-2 text-2xl font-semibold">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {jobs.map((j, i) => (
          <motion.div
            key={j.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-lg bg-muted/40 grid place-items-center text-primary"><Bot className="size-4" /></div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{j.name}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <Clock className="size-3" />
                    {j.startedAt ? new Date(j.startedAt).toLocaleString() : "Queued"}
                    {j.finishedAt && ` · ${j.duration}s`}
                    <span className="text-muted-foreground/60">·</span>
                    <span>runner: {j.runner}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Pill intent={j.state === "completed" ? "success" : j.state === "running" ? "info" : j.state === "queued" ? "warning" : j.state === "failed" ? "danger" : "neutral"}>{j.state}</Pill>
                {j.state === "failed" && (
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => toast.success(`Retrying ${j.name}`)}><RefreshCw className="size-3.5" /> Retry</Button>
                )}
                {(j.state === "running" || j.state === "queued") && (
                  <Button size="sm" variant="ghost" className="rounded-lg text-destructive" onClick={() => toast.message(`Cancelled ${j.name}`)}><X className="size-3.5" /> Cancel</Button>
                )}
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${j.progress}%` }}
                transition={{ duration: 0.8 }}
                className={"h-full rounded-full " + (j.state === "failed" ? "bg-destructive" : "gradient-primary")}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium">{j.progress}%</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
