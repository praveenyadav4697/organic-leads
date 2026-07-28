import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="h-16 flex items-center gap-2 px-4 border-b border-sidebar-border">
        <div className="size-9 rounded-xl gradient-primary grid place-items-center shadow-[var(--shadow-glow)] shrink-0">
          <Sparkles className="size-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight text-sidebar-foreground truncate">Nebula AI</div>
            <div className="text-[11px] text-muted-foreground truncate">Marketing OS · Phase 1</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Foundation
          </div>
        )}
        {navItems.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                active &&
                  "bg-gradient-to-r from-primary/12 to-accent/8 text-sidebar-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--color-primary)_25%,transparent)]",
              )}
            >
              <item.icon
                className={cn(
                  "size-[18px] shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
              {!collapsed && item.badge && (
                <Badge className="h-5 px-1.5 text-[10px] gradient-primary text-white border-0">{item.badge}</Badge>
              )}
              {active && !collapsed && <span className="size-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-2xl p-3 gradient-primary text-white shadow-[var(--shadow-glow)]">
            <div className="text-xs font-semibold">Upgrade to Enterprise</div>
            <div className="text-[11px] opacity-90 mt-0.5">Unlimited AI credits & audit history.</div>
            <button className="mt-2.5 w-full h-8 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-medium transition">
              Contact sales
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
