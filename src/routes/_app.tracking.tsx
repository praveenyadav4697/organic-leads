import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { motion } from "framer-motion";
import {
  CheckCircle2, ShieldCheck, Cookie, Target, Activity, Bell,
  Phone, Mail, MessageCircle, Globe,
} from "lucide-react";

export const Route = createFileRoute("/_app/tracking")({
  head: () => ({ meta: [{ title: "Tracking Center — Nebula" }] }),
  component: Tracking,
});

const pixels = [
  { name: "Google Analytics 4", id: "G-XXXX2024", status: "connected", icon: Globe },
  { name: "Google Tag Manager", id: "GTM-A1B2C3", status: "connected", icon: Activity },
  { name: "Meta Pixel", id: "1029384756", status: "connected", icon: ShieldCheck },
  { name: "Meta CAPI", id: "capi_84j2k", status: "connected", icon: ShieldCheck },
  { name: "LinkedIn Insight Tag", id: "insight-8842", status: "disconnected", icon: Activity },
  { name: "TikTok Pixel", id: "tt_pixel_92k", status: "connected", icon: Activity },
  { name: "Pinterest Tag", id: "pin-281", status: "connected", icon: Activity },
  { name: "X / Twitter Pixel", id: "tw-pixel-44", status: "pending", icon: Activity },
  { name: "Snapchat Pixel", id: "snap-22k", status: "disconnected", icon: Activity },
  { name: "Bing UET", id: "uet-72", status: "connected", icon: Activity },
];

const channels = [
  { l: "Phone tracking", v: "Dynamic Number Insertion", s: "good" as const },
  { l: "Email tracking", v: "Mailtrack · HubSpot", s: "good" as const },
  { l: "WhatsApp tracking", v: "WhatsApp Business API", s: "good" as const },
  { l: "Lead tracking", v: "HubSpot CRM", s: "good" as const },
];

function Tracking() {
  return (
    <div>
      <PageHeader
        eyebrow="Section 8"
        title="Tracking Center"
        description="Every pixel, tag, consent banner, event, conversion, and lead — verified, live, and audit-ready."
        actions={
          <>
            <Button variant="outline" className="rounded-xl h-10">Verify installation</Button>
            <Button className="rounded-xl h-10 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">+ Add platform</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { l: "Connected platforms", v: "9 / 14" },
          { l: "Events firing", v: "124 / day" },
          { l: "Last sync", v: "Just now" },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-border bg-card p-5">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
            <div className="text-3xl font-semibold mt-2">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 mb-6">
        <div className="text-lg font-semibold mb-4">Pixels & Tags</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pixels.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border bg-card p-5 card-hover"
            >
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-xl bg-muted grid place-items-center">
                  <t.icon className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">{t.id}</div>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="text-muted-foreground flex items-center gap-1.5">
                  {t.status === "connected" ? <CheckCircle2 className="size-3.5 text-success" /> : <span className="size-2 rounded-full bg-muted-foreground" />}
                  {t.status === "connected" ? "Firing correctly" : t.status === "pending" ? "Awaiting verification" : "No events detected"}
                </div>
                <Button variant="outline" size="sm" className="rounded-lg">Verify</Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cookie className="size-4 text-primary" /> Consent & Privacy
          </div>
          <div className="space-y-3">
            {[
              { l: "Cookie banner", v: "Active · GDPR & CCPA", s: "good" as const, i: Cookie },
              { l: "Cookie policy", v: "Synced with privacy policy", s: "good" as const, i: ShieldCheck },
              { l: "Consent mode v2", v: "Google Consent Mode", s: "good" as const, i: ShieldCheck },
              { l: "Privacy policy", v: "Last updated 12d ago", s: "good" as const, i: ShieldCheck },
              { l: "Data retention", v: "14 months · auto-purge", s: "warn" as const, i: Activity },
              { l: "Cookie audit", v: "42 cookies · 2 critical", s: "warn" as const, i: Cookie },
            ].map((c) => (
              <div key={c.l} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="size-9 rounded-lg bg-card border border-border grid place-items-center">
                  <c.i className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.l}</div>
                  <div className="text-[11px] text-muted-foreground">{c.v}</div>
                </div>
                <StatusBadge status={c.s} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="size-4 text-primary" /> Goals & Conversions
          </div>
          <div className="space-y-3">
            {[
              { l: "Form submission", v: "Hero CTA · Footer", v2: "184 / wk" },
              { l: "Demo booked", v: "Calendly webhook", v2: "42 / wk" },
              { l: "Trial started", v: "Free trial signup", v2: "68 / wk" },
              { l: "Newsletter sign-up", v: "Footer form", v2: "312 / wk" },
              { l: "Whitepaper download", v: "/resources/gated", v2: "94 / wk" },
              { l: "Outbound link click", v: "Pricing CTA", v2: "1,824 / wk" },
            ].map((g) => (
              <div key={g.l} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <Target className="size-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{g.l}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{g.v}</div>
                </div>
                <div className="text-xs font-semibold">{g.v2}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Custom events
          </div>
          <div className="space-y-2">
            {[
              { n: "video_play", v: "Hero demo video" },
              { n: "pricing_cta_click", v: "Pricing card → /demo" },
              { n: "scroll_75", v: "75% page depth" },
              { n: "exit_intent", v: "Exit intent popup shown" },
              { n: "feature_compare", v: "Comparison table interaction" },
            ].map((e) => (
              <div key={e.n} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <code className="text-xs font-mono px-2 py-0.5 rounded bg-card border border-border">{e.n}</code>
                <div className="text-xs text-muted-foreground flex-1 truncate">{e.v}</div>
                <StatusBadge status="good" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="size-4 text-primary" /> Channel-specific tracking
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {channels.map((c) => (
              <div key={c.l} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20">
                <div className="size-9 rounded-lg bg-card border border-border grid place-items-center">
                  {c.l === "Phone tracking" && <Phone className="size-4 text-primary" />}
                  {c.l === "Email tracking" && <Mail className="size-4 text-primary" />}
                  {c.l === "WhatsApp tracking" && <MessageCircle className="size-4 text-primary" />}
                  {c.l === "Lead tracking" && <Target className="size-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{c.l}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{c.v}</div>
                </div>
                <StatusBadge status={c.s} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}