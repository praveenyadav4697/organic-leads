import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Sparkles, Lightbulb, Code2, FileText } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { SearchKnowledgeNav } from "@/modules/search-knowledge/components";

export type KP = {
  title: string;
  description: string;
  eyebrow?: string;
  actions?: ReactNode;
  summary: string;
  sections: KnowledgeSection[];
  bestPractices: string[];
  examples?: { query: string; result: string }[];
};

export type KnowledgeSection =
  | { kind: "cards"; title?: string; items: { title: string; description: string; icon?: ReactNode; meta?: string }[] }
  | { kind: "table"; title?: string; columns: string[]; rows: (string | number)[][] }
  | { kind: "timeline"; title?: string; items: { year: string; title: string; description: string }[] }
  | { kind: "list"; title?: string; items: string[] }
  | { kind: "statgrid"; title?: string; items: { label: string; value: string; sub?: string }[] }
  | { kind: "code"; title?: string; code: string; language?: string }
  | { kind: "chart"; title?: string; description?: string; chart: ReactNode };

export function KnowledgePage(props: KP) {
  return (
    <div>
      <PageHeader
        eyebrow={props.eyebrow ?? "Search Knowledge · Phase 1"}
        title={props.title}
        description={props.description}
        actions={props.actions}
      />
      <SearchKnowledgeNav />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {props.sections.map((s, i) => (
            <Section key={i} section={s} />
          ))}

          {props.examples && props.examples.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="size-8 rounded-xl bg-muted grid place-items-center">
                  <Code2 className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Search examples</div>
                  <div className="text-sm font-semibold">Live query patterns</div>
                </div>
              </div>
              <div className="space-y-3">
                {props.examples.map((ex, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Query</div>
                    <div className="font-mono text-xs text-primary break-words">{ex.query}</div>
                    <div className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">Result</div>
                    <div className="text-xs leading-relaxed">{ex.result}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border p-6 bg-gradient-to-br from-primary/8 via-card to-accent/8"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-xl gradient-primary grid place-items-center">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="text-sm font-semibold">AI summary</div>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{props.summary}</p>
          </motion.div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-xl bg-warning/15 grid place-items-center">
                <Lightbulb className="size-4 text-warning-foreground" />
              </div>
              <div className="text-sm font-semibold">Best practices</div>
            </div>
            <ul className="space-y-2.5">
              {props.bestPractices.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                  <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 rounded-xl bg-muted grid place-items-center">
                <FileText className="size-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-semibold">Further reading</div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div>Google Search Central documentation</div>
              <div>Moz · Search Engine Ranking Factors</div>
              <div>Search Engine Journal · Industry studies</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ section }: { section: KnowledgeSection }) {
  switch (section.kind) {
    case "cards":
      return (
        <div className="rounded-3xl border border-border bg-card p-6">
          {section.title && <div className="text-sm font-semibold mb-4">{section.title}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {section.items.map((it, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-muted/20 p-4"
              >
                <div className="flex items-start gap-3">
                  {it.icon && (
                    <div className="size-9 rounded-xl bg-card border border-border grid place-items-center shrink-0">
                      {it.icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{it.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{it.description}</div>
                    {it.meta && <div className="text-[11px] text-primary mt-1.5 font-medium">{it.meta}</div>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    case "table":
      return (
        <div className="rounded-3xl border border-border bg-card p-6">
          {section.title && <div className="text-sm font-semibold mb-4">{section.title}</div>}
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  {section.columns.map((c, i) => (
                    <th key={i} className="text-left px-3 py-2.5 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {section.rows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition">
                    {r.map((c, j) => (
                      <td key={j} className={cn("px-3 py-3", j === 0 && "font-medium")}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case "timeline":
      return (
        <div className="rounded-3xl border border-border bg-card p-6">
          {section.title && <div className="text-sm font-semibold mb-4">{section.title}</div>}
          <ol className="relative border-l-2 border-primary/30 pl-5 space-y-5">
            {section.items.map((it, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1 size-3 rounded-full bg-gradient-to-br from-primary to-accent ring-4 ring-card" />
                <div className="text-[11px] uppercase tracking-widest text-primary font-semibold">{it.year}</div>
                <div className="text-sm font-semibold mt-0.5">{it.title}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{it.description}</div>
              </li>
            ))}
          </ol>
        </div>
      );
    case "list":
      return (
        <div className="rounded-3xl border border-border bg-card p-6">
          {section.title && <div className="text-sm font-semibold mb-4">{section.title}</div>}
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {section.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                <span className="mt-1.5 size-1.5 rounded-full bg-accent shrink-0" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "statgrid":
      return (
        <div className="rounded-3xl border border-border bg-card p-6">
          {section.title && <div className="text-sm font-semibold mb-4">{section.title}</div>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {section.items.map((it, i) => (
              <div key={i} className="rounded-2xl bg-muted/30 p-4">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{it.label}</div>
                <div className="text-lg font-semibold mt-1">{it.value}</div>
                {it.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{it.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    case "code":
      return (
        <div className="rounded-3xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-muted/40">
            <div className="size-2 rounded-full bg-destructive/70" />
            <div className="size-2 rounded-full bg-warning/70" />
            <div className="size-2 rounded-full bg-success/70" />
            <div className="text-[11px] text-muted-foreground ml-3">
              {section.title ?? "Example"} · {section.language ?? "json"}
            </div>
          </div>
          <pre className="p-5 text-xs font-mono leading-relaxed overflow-auto">
            <code>{section.code}</code>
          </pre>
        </div>
      );
    case "chart":
      return (
        <div className="rounded-3xl border border-border bg-card p-6">
          {section.title && <div className="text-sm font-semibold mb-2">{section.title}</div>}
          {section.description && (
            <div className="text-xs text-muted-foreground mb-4">{section.description}</div>
          )}
          <div className="h-64">{section.chart}</div>
        </div>
      );
  }
}
