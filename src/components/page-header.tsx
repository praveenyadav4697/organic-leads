import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 mb-6"
    >
      <div
        aria-hidden
        className="absolute -top-24 -right-24 size-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "conic-gradient(from 90deg, var(--color-primary), var(--color-accent), var(--color-primary))" }}
      />
      <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">{eyebrow}</div>
          )}
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            <span className="gradient-text">{title}</span>
          </h1>
          {description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </motion.div>
  );
}
