import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { AIPanel } from "@/components/layout/ai-panel";
import { CommandPalette } from "@/components/layout/command-palette";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [ai, setAi] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onOpenAssistant={() => setAi(true)}
          onOpenPalette={() => setPalette(true)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <AIPanel open={ai} onClose={() => setAi(false)} />
      <CommandPalette open={palette} onOpenChange={setPalette} />
      <Toaster />
    </div>
  );
}
