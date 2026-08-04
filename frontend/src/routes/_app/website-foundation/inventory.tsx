import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Newspaper, Menu, LayoutGrid, Palette, Plug, FormInput, Image as ImageIcon, Users, Shield, FolderTree, Tag, LayoutTemplate, Code2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auditService } from "@/modules/website-foundation/services";
import type { ComponentInventory } from "@/modules/website-foundation/types";
import { toast } from "sonner";
import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";

export const Route = createFileRoute("/_app/website-foundation/inventory")({
  head: () => ({ meta: [{ title: "Component Inventory | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Inventory">
      <ComponentInventoryPage />
    </ErrorBoundary>
  ),
});

const items: { label: string; key: keyof ComponentInventory; icon: React.ComponentType<{ className?: string }>; hint: string }[] = [
  { label: "Pages", key: "pages", icon: FileText, hint: "Static page entries" },
  { label: "Posts", key: "posts", icon: Newspaper, hint: "Blog articles" },
  { label: "Menus", key: "menus", icon: Menu, hint: "Navigation menus" },
  { label: "Widgets", key: "widgets", icon: LayoutGrid, hint: "Active widgets" },
  { label: "Themes", key: "themes", icon: Palette, hint: "Installed themes" },
  { label: "Plugins", key: "plugins", icon: Plug, hint: "All plugins" },
  { label: "Forms", key: "forms", icon: FormInput, hint: "Forms across the site" },
  { label: "Media", key: "media", icon: ImageIcon, hint: "Media library items" },
  { label: "Users", key: "users", icon: Users, hint: "Active users" },
  { label: "Roles", key: "roles", icon: Shield, hint: "User roles" },
  { label: "Categories", key: "categories", icon: FolderTree, hint: "Taxonomy categories" },
  { label: "Tags", key: "tags", icon: Tag, hint: "Free-form tags" },
  { label: "Templates", key: "templates", icon: LayoutTemplate, hint: "Page templates" },
  { label: "Shortcodes", key: "shortcodes", icon: Code2, hint: "Registered shortcodes" },
  { label: "Custom post types", key: "customPostTypes", icon: Database, hint: "Custom type definitions" },
];

function ComponentInventoryPage() {
  const [inv, setInv] = useState<ComponentInventory | null>(null);
  useEffect(() => { auditService.inventory().then(setInv); }, []);
  if (!inv) return <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Component inventory</div>
          <div className="text-xs text-muted-foreground">Generated · 2026-07-28 · 1m 24s</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Inventory JSON downloaded")}>Export JSON</Button>
          <Button className="rounded-xl gradient-primary text-white border-0" onClick={() => toast.success("Inventory regenerated")}>Regenerate</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
            <div className="mt-2 text-2xl font-semibold">{(inv[it.key] ?? 0).toLocaleString()}</div>
            <div className="text-[11px] text-muted-foreground">{it.hint}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
