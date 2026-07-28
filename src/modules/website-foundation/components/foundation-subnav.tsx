import { useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubNavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

interface SubNavProps {
  items: SubNavItem[];
  activePath: string;
  resolveActive: (item: SubNavItem) => boolean;
  brandLabel?: string;
}

export function FoundationSubNav({ items, activePath, resolveActive, brandLabel = "Website Foundation" }: SubNavProps) {
  const active = items.find((it) => resolveActive(it)) ?? items[0];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = items.filter((it) => it.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="rounded-2xl border border-border bg-card p-2">
      {/* Mobile / compact dropdown trigger */}
      <div className="md:hidden" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-3 px-4 h-11 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border/60 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="flex items-center gap-2 truncate">
            <active.icon className="size-4 text-primary" />
            {active.label}
            {active.badge && (
              <span className="text-[10px] font-semibold rounded-full bg-primary/15 text-primary px-1.5 py-0.5">{active.badge}</span>
            )}
          </span>
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="mt-2 rounded-xl border border-border bg-card shadow-[var(--shadow-glow)] overflow-hidden"
            >
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${brandLabel}…`}
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted/30 text-sm border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                </div>
              </div>
              <ul role="listbox" className="max-h-80 overflow-y-auto py-1">
                {filtered.length === 0 && (
                  <li className="px-4 py-6 text-center text-xs text-muted-foreground">No sections match.</li>
                )}
                {filtered.map((it) => {
                  const isActive = resolveActive(it);
                  return (
                    <li key={it.to}>
                      <a
                        href={it.to}
                        onClick={() => setOpen(false)}
                        role="option"
                        aria-selected={isActive}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm transition",
                          isActive
                            ? "bg-gradient-to-r from-primary/12 to-accent/8 text-foreground"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                        )}
                      >
                        <it.icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                        <span className="flex-1 truncate">{it.label}</span>
                        {it.badge && (
                          <span className="text-[10px] font-semibold rounded-full bg-primary/15 text-primary px-1.5 py-0.5">{it.badge}</span>
                        )}
                        {isActive && <span className="size-1.5 rounded-full bg-primary" />}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop / tablet tab bar — wraps naturally, no horizontal scroll */}
      <div
        role="tablist"
        aria-label={brandLabel}
        className="hidden md:flex flex-wrap items-center gap-1.5"
      >
        {items.map((it) => {
          const isActive = resolveActive(it);
          return (
            <motion.a
              key={it.to}
              href={it.to}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "relative inline-flex items-center gap-2 px-3.5 h-10 rounded-xl text-sm font-medium border whitespace-nowrap transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isActive
                  ? "bg-gradient-to-r from-primary/12 to-accent/8 text-foreground border-transparent shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/40 hover:border-border/60",
              )}
            >
              <it.icon className={cn("size-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{it.label}</span>
              {it.badge && (
                <span className="text-[10px] font-semibold rounded-full bg-primary/15 text-primary px-1.5 py-0.5">
                  {it.badge}
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId="foundation-tab-underline"
                  className="absolute left-3 right-3 -bottom-1 h-0.5 rounded-full gradient-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
