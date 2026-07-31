import { createFileRoute } from "@tanstack/react-router";
import { TrackingNav } from "@/modules/tracking/components";

export const Route = createFileRoute("/_app/tracking/spam-protection")({
  head: () => ({ meta: [{ title: "Spam Protection — Nebula" }] }),
  component: () => (
    <div>
      <TrackingNav />
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="text-lg font-semibold mb-4">Spam Protection</div>
        <p className="text-sm text-muted-foreground">Configure reCAPTCHA, honeypot, rate limiting, and keyword filtering.</p>
      </div>
    </div>
  ),
});