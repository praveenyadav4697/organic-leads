import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
}

export interface WizardProps {
  steps: WizardStep[];
  onFinish?: () => void;
  finishLabel?: string;
}

export function Wizard({ steps, onFinish, finishLabel = "Finish" }: WizardProps) {
  const [active, setActive] = useState(0);
  const step = steps[active];

  const next = () => {
    if (active < steps.length - 1) setActive((i) => i + 1);
    else onFinish?.();
  };
  const prev = () => setActive((i) => Math.max(0, i - 1));

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <ol className="border-b lg:border-b-0 lg:border-r border-border bg-muted/20 p-3 space-y-1">
          {steps.map((s, i) => {
            const done = i < active;
            const current = i === active;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition",
                    current && "bg-card shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_30%,transparent)]",
                    !current && "hover:bg-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "size-7 rounded-lg grid place-items-center text-xs font-semibold shrink-0",
                      done && "bg-success/15 text-success",
                      current && "gradient-primary text-white",
                      !done && !current && "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate">{s.title}</span>
                    {s.description && (
                      <span className="block text-[11px] text-muted-foreground truncate">{s.description}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="p-5 md:p-6 min-h-[420px] flex flex-col">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Step {active + 1} of {steps.length}</div>
          <h3 className="text-lg font-semibold mt-1">{step.title}</h3>
          {step.description && <p className="text-sm text-muted-foreground mt-1">{step.description}</p>}
          <div className="mt-5 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                {step.content}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between gap-2 pt-5 border-t border-border mt-5">
            <Button variant="ghost" className="rounded-xl" onClick={prev} disabled={active === 0}>
              <ChevronLeft className="size-4" /> Back
            </Button>
            <div className="flex items-center gap-1">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-6 bg-primary" : "w-1.5 bg-muted",
                  )}
                />
              ))}
            </div>
            <Button
              className="rounded-xl gradient-primary text-white border-0 shadow-[var(--shadow-glow)]"
              onClick={next}
            >
              {active === steps.length - 1 ? finishLabel : "Next"}
              {active < steps.length - 1 && <ChevronRight className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
