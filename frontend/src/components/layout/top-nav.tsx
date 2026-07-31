import { Bell, PanelLeft, Search, Sparkles, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useRouterState } from "@tanstack/react-router";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function TopNav({
  onToggleSidebar,
  onOpenAssistant,
  onOpenPalette,
}: {
  onToggleSidebar: () => void;
  onOpenAssistant: () => void;
  onOpenPalette: () => void;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const current =
    navItems.find((n) => (n.to === "/" ? pathname === "/" : n.to === pathname)) ||
    navItems.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-3 px-4 lg:px-6 border-b border-border bg-background/70 backdrop-blur-xl">
      <Button variant="ghost" size="icon" className="rounded-xl" onClick={onToggleSidebar}>
        <PanelLeft className="size-[18px]" />
      </Button>

      <nav className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
        <Link to="/" className="hover:text-foreground truncate">Organic Leads</Link>
        <span className="opacity-40">/</span>
        <span className="text-foreground font-medium truncate">{current?.title ?? "Dashboard"}</span>
      </nav>

      <button
        onClick={onOpenPalette}
        className={cn(
          "ml-auto hidden md:flex items-center gap-2 h-10 pl-3 pr-2 w-[380px] rounded-xl",
          "border border-input bg-card/60 backdrop-blur hover:border-primary/40 transition text-sm text-muted-foreground",
        )}
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search anything, run commands…</span>
        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-md border border-border bg-muted text-muted-foreground flex items-center gap-0.5">
          <Command className="size-3" />K
        </kbd>
      </button>

      <Button variant="ghost" size="icon" className="rounded-xl md:hidden ml-auto" onClick={onOpenPalette}>
        <Search className="size-[18px]" />
      </Button>

      <Button
        onClick={onOpenAssistant}
        className="rounded-xl h-10 gradient-primary text-white hover:opacity-90 border-0 shadow-[var(--shadow-glow)]"
      >
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Ask AI</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-xl relative">
            <Bell className="size-[18px]" />
            <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            Notifications <Badge variant="secondary">3 new</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {[
            "Audit finished for your website — score 96",
            "Google Search Console needs reconnection",
            "New competitor detected",
          ].map((n) => (
            <DropdownMenuItem key={n} className="py-2.5 gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-xs">{n}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 pl-1 pr-2 h-10 rounded-xl hover:bg-muted transition">
              <Avatar className="size-8">
                <AvatarFallback className="gradient-primary text-white text-xs font-semibold">OL</AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-semibold">User</div>
                <div className="text-[10px] text-muted-foreground">Organization</div>
              </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Organization</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>API keys</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
