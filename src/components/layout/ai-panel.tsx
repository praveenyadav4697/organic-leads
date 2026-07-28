import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, Send, Wand2, TrendingUp, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiInsights } from "@/lib/mock-data";

export function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px] lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed right-0 top-0 z-50 h-screen w-full sm:w-[420px] bg-card border-l border-border shadow-2xl flex flex-col"
          >
            <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
              <div className="size-9 rounded-xl gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">Nebula Copilot</div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                  Online · GPT-4o class
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="rounded-2xl p-4 border border-border bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
                  <Wand2 className="size-3.5" /> Suggested for you
                </div>
                <div className="space-y-2">
                  {["Summarize this week's SEO changes", "Draft 5 blog titles for 'AI marketing automation'", "Which competitor is closest to overtaking us?"].map(
                    (s) => (
                      <button
                        key={s}
                        className="w-full text-left text-xs rounded-xl px-3 py-2 bg-card border border-border hover:border-primary/40 transition"
                      >
                        {s}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground px-1">
                  Live insights
                </div>
                {aiInsights.map((t, i) => (
                  <div key={i} className="rounded-2xl p-4 bg-card border border-border card-hover">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5">
                      {i % 2 === 0 ? <TrendingUp className="size-3.5 text-success" /> : <ShieldCheck className="size-3.5 text-accent" />}
                      Insight #{i + 1}
                    </div>
                    <p className="text-sm leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3 py-2">
                <Sparkles className="size-4 text-primary shrink-0" />
                <input
                  placeholder="Ask anything about your marketing…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button size="icon" className="size-8 rounded-lg gradient-primary text-white border-0">
                  <Send className="size-3.5" />
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
