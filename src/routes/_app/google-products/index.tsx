import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { motion } from "framer-motion";
import { Search, Tag, BarChart3, Store, ShoppingCart, Megaphone, Youtube, MapPin, Gauge, Code2, TrendingUp, Type, Globe, PenSquare, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const googleProducts: {
  key: string;
  name: string;
  status: "connected" | "disconnected" | "pending";
  health: number;
  sync: string;
  owner: string;
  scopes: string;
  description: string;
  icon: LucideIcon;
}[] = [
  { key: "search-console", name: "Search Console", status: "connected", health: 96, sync: "12m ago", owner: "Ava Kepler", scopes: "searchconsole.readonly", description: "Performance, coverage, and indexing data from Google Search.", icon: Search },
  { key: "analytics", name: "Analytics (GA4)", status: "connected", health: 98, sync: "Just now", owner: "Ava Kepler", scopes: "analytics.readonly, analytics.manage.users", description: "Session, conversion, and audience data for every property.", icon: BarChart3 },
  { key: "tag-manager", name: "Tag Manager", status: "connected", health: 100, sync: "3m ago", owner: "Ava Kepler", scopes: "tagmanager.readonly, tagmanager.edit.containers", description: "Server-side and client-side tag orchestration.", icon: Tag },
  { key: "business", name: "Business Profile", status: "connected", health: 91, sync: "1h ago", owner: "Marcus Lane", scopes: "businessprofile.readonly", description: "Manage GBP listings, reviews, posts, and local search.", icon: Store },
  { key: "merchant", name: "Merchant Center", status: "disconnected", health: 0, sync: "—", owner: "—", scopes: "—", description: "Product feed for free listings and Shopping ads.", icon: ShoppingCart },
  { key: "ads", name: "Google Ads", status: "connected", health: 88, sync: "8m ago", owner: "Ivy Sun", scopes: "adwords.readonly", description: "Search, Display, Performance Max and YouTube ad accounts.", icon: Megaphone },
  { key: "adsense", name: "AdSense", status: "pending", health: 64, sync: "Yesterday", owner: "Ivy Sun", scopes: "adsense.readonly", description: "Programmatic ad serving and earnings reports.", icon: Globe },
  { key: "pagespeed", name: "PageSpeed Insights API", status: "connected", health: 100, sync: "Live", owner: "Service", scopes: "pagespeedonline.readonly", description: "Real-user and lab Core Web Vitals data.", icon: Gauge },
  { key: "structured-data", name: "Structured Data Tool", status: "connected", health: 100, sync: "Live", owner: "Service", scopes: "—", description: "Schema.org markup testing and validation.", icon: Code2 },
  { key: "trends", name: "Google Trends", status: "connected", health: 100, sync: "1h ago", owner: "Service", scopes: "trends.readonly", description: "Topic trend curves across regions and time.", icon: TrendingUp },
  { key: "fonts", name: "Google Fonts", status: "connected", health: 100, sync: "Live", owner: "Service", scopes: "—", description: "Web font performance, privacy and availability.", icon: Type },
  { key: "maps", name: "Maps Platform", status: "connected", health: 97, sync: "40m ago", owner: "Marcus Lane", scopes: "maps-backend.readonly", description: "Map tiles, geocoding, and Places API.", icon: MapPin },
  { key: "youtube", name: "YouTube Data API", status: "connected", health: 94, sync: "22m ago", owner: "Ivy Sun", scopes: "youtube.readonly, youtube.upload", description: "Channel stats, video metadata, captions.", icon: Youtube },
  { key: "blogger", name: "Blogger", status: "disconnected", health: 0, sync: "—", owner: "—", scopes: "—", description: "Legacy blog publishing platform.", icon: PenSquare },
  { key: "groups", name: "Google Groups", status: "connected", health: 100, sync: "1d ago", owner: "Org Admin", scopes: "groups.readonly", description: "Team mailing lists and permissions sync.", icon: Users },
];

export const Route = createFileRoute("/_app/google-products/")({
  head: () => ({
    meta: [
      { title: "Google Product Registry — Nebula" },
    ],
  }),
  component: GoogleProducts,
});

function GoogleProducts() {
  return (
    <div>
      <PageHeader
        eyebrow="Section 9"
        title="Google Product Registry"
        description="One unified registry for every Google product powering your business."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {googleProducts.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card p-5 card-hover"
            >
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-xl gradient-primary grid place-items-center shrink-0 shadow-[var(--shadow-glow)]">
                  <Icon className="size-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</div>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Health</span>
                  <span className="font-semibold">{p.health}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.health}%` }}
                    transition={{ duration: 0.9 }}
                    className="h-full gradient-primary rounded-full"
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Owner</div>
                  <div className="font-medium truncate">{p.owner}</div>
                </div>
                <div className="rounded-lg bg-muted/30 p-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Last sync</div>
                  <div className="font-medium truncate">{p.sync}</div>
                </div>
              </div>
              <div className="mt-3 text-[10px] text-muted-foreground font-mono truncate">Scopes: {p.scopes}</div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="rounded-lg">Logs</Button>
                {p.status === "connected" ? (
                  <Button variant="outline" size="sm" className="rounded-lg">Disconnect</Button>
                ) : (
                  <Button size="sm" className="rounded-lg gradient-primary text-white border-0">Connect</Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}