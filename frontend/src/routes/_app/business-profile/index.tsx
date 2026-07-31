import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Upload, Building2, Globe2, Phone, Mail, MapPin, Clock, Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_app/business-profile/")({
  head: () => ({
    meta: [
      { title: "Business Profile | Organic Leads" },
      {
        name: "description",
        content: "Define your brand DNA: industry, audience, geography, competitors, voice, and goals — the fuel for every AI recommendation.",
      },
    ],
  }),
  component: BusinessProfile,
});

function BusinessProfile() {
  return (
    <div>
      <PageHeader
        eyebrow="Section 2"
        title="Business Profile"
        description="The single source of truth for your brand. Everything AI generates flows from this."
        actions={
          <>
            <Button variant="outline" className="rounded-xl h-10">
              <Lock className="size-4" /> Save draft
            </Button>
            <Button className="rounded-xl h-10 gradient-primary text-white border-0 shadow-[var(--shadow-glow)]">
              <Save className="size-4" /> Save & Publish
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card title="Company">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Field label="Company name"><Input defaultValue="Organic Leads Inc." className="rounded-xl h-11" /></Field>
               <Field label="Legal name"><Input defaultValue="Organic Leads Holdings, Inc." className="rounded-xl h-11" /></Field>
              <Field label="GST number"><Input defaultValue="22AAAAA0000A1Z5" className="rounded-xl h-11" /></Field>
              <Field label="Registration number"><Input defaultValue="CIN: U72200KA2018PTC123456" className="rounded-xl h-11" /></Field>
              <Field label="Industry"><Input defaultValue="SaaS · Marketing Automation" className="rounded-xl h-11" /></Field>
              <Field label="Sub-industry"><Input defaultValue="AI Marketing Intelligence" className="rounded-xl h-11" /></Field>
              <Field label="Business category"><Input defaultValue="B2B SaaS" className="rounded-xl h-11" /></Field>
              <Field label="Brand voice"><Input defaultValue="Confident · Concise · Human" className="rounded-xl h-11" /></Field>
            </div>
          </Card>

          <Card title="Brand DNA">
            <Field label="Mission">
              <Textarea rows={2} className="rounded-xl" defaultValue="Empower every marketing team to win organic growth with one intelligent workspace." />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Vision"><Textarea rows={3} className="rounded-xl" defaultValue="A world where every brand has the unfair advantage of AI-grade marketing intelligence." /></Field>
              <Field label="USP"><Textarea rows={3} className="rounded-xl" defaultValue="The only AI marketing OS that unifies SEO, content, ads, and analytics — with enterprise-grade governance." /></Field>
            </div>
            <div className="mt-4">
              <Field label="Brand story">
                <Textarea rows={3} className="rounded-xl" defaultValue="Founded to unify website performance, SEO, and marketing automation into one trusted platform. Organic Leads helps teams move faster with connected data and clear action paths." />
              </Field>
            </div>
          </Card>

          <Card title="Products & Services">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Products"><Textarea rows={3} className="rounded-xl" defaultValue="Organic Leads SEO Suite · Organic Leads Studio · Organic Leads Ads Optimizer · Organic Leads Analytics" /></Field>
              <Field label="Services"><Textarea rows={3} className="rounded-xl" defaultValue="Enterprise SEO, Content Strategy, Paid Media, Analytics, CRO, Digital PR" /></Field>
              <Field label="Target audience"><Input defaultValue="B2B enterprise marketing teams (500+)" className="rounded-xl h-11" /></Field>
              <Field label="Ideal customer profile"><Input defaultValue="CMO/VP Marketing at $50M+ ARR SaaS companies" className="rounded-xl h-11" /></Field>
              <Field label="Customer persona"><Textarea rows={3} className="rounded-xl md:col-span-2" defaultValue="Maya, 38, CMO of a Series C SaaS. Owns $4M annual marketing budget. Cares about pipeline attribution, organic growth, and proving marketing's ROI. Hates tool sprawl and prefers opinionated platforms." /></Field>
            </div>
          </Card>

          <Card title="Goals">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Business goals"><Textarea rows={3} className="rounded-xl" defaultValue="Grow MRR 30% YoY · Expand to EMEA · Launch enterprise tier · Reach $50M ARR by 2027" /></Field>
              <Field label="Marketing goals"><Textarea rows={3} className="rounded-xl" defaultValue="2x organic traffic in 12 months · 3x MQL volume · Reduce CAC by 25% · Rank #1 for 50 enterprise keywords" /></Field>
            </div>
          </Card>

          <Card title="Geography">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Country"><Input defaultValue="United States" className="rounded-xl h-11" /></Field>
              <Field label="State"><Input defaultValue="California" className="rounded-xl h-11" /></Field>
              <Field label="City"><Input defaultValue="San Francisco" className="rounded-xl h-11" /></Field>
              <Field label="Pincode / ZIP"><Input defaultValue="94103" className="rounded-xl h-11" /></Field>
              <Field label="Timezone"><Input defaultValue="America/Los_Angeles" className="rounded-xl h-11" /></Field>
              <Field label="Languages"><Input defaultValue="English, Spanish, German" className="rounded-xl h-11" /></Field>
            </div>
          </Card>

          <Card title="Contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Field label="Website"><Input defaultValue="https://organicleads.io" className="rounded-xl h-11" /></Field>
               <Field label="Email"><Input defaultValue="hello@organicleads.io" className="rounded-xl h-11" /></Field>
              <Field label="Phone"><Input defaultValue="+1 415 555 0123" className="rounded-xl h-11" /></Field>
              <Field label="WhatsApp"><Input defaultValue="+1 415 555 0199" className="rounded-xl h-11" /></Field>
              <Field label="Business hours"><Input defaultValue="Mon–Fri 9:00–18:00 PT" className="rounded-xl h-11" /></Field>
              <Field label="24/7 support"><Input defaultValue="Enterprise customers only" className="rounded-xl h-11" /></Field>
            </div>
          </Card>

          <Card title="Social Media & Competitors">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="LinkedIn"><Input defaultValue="linkedin.com/company/acme" className="rounded-xl h-11" /></Field>
              <Field label="X / Twitter"><Input defaultValue="twitter.com/acme" className="rounded-xl h-11" /></Field>
              <Field label="YouTube"><Input defaultValue="youtube.com/@acme" className="rounded-xl h-11" /></Field>
              <Field label="Instagram"><Input defaultValue="instagram.com/acme" className="rounded-xl h-11" /></Field>
              <Field label="Top competitors"><Textarea rows={3} className="rounded-xl md:col-span-2" defaultValue="HubSpot · SEMrush · Ahrefs · Moz · Conductor · BrightEdge" /></Field>
            </div>
          </Card>

          <Card title="Brand guidelines">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { l: "Primary", v: "#6366F1" },
                { l: "Accent", v: "#22D3EE" },
                { l: "Neutral", v: "#0F172A" },
                { l: "Success", v: "#22C55E" },
                { l: "Warning", v: "#F59E0B" },
                { l: "Destructive", v: "#EF4444" },
              ].map((c) => (
                <div key={c.l} className="rounded-xl border border-border bg-muted/20 p-3 flex items-center gap-3">
                  <div className="size-9 rounded-md border border-border" style={{ background: c.v }} />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
                    <div className="text-xs font-mono">{c.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border bg-card p-6"
          >
            <div className="text-sm font-semibold mb-3">Business logo</div>
            <div className="aspect-square rounded-2xl border border-dashed border-border grid place-items-center bg-muted/30 relative overflow-hidden">
              <div className="absolute inset-0 gradient-primary opacity-10" />
              <div className="relative text-center">
                <div className="mx-auto size-14 rounded-2xl gradient-primary grid place-items-center mb-3 shadow-[var(--shadow-glow)]">
                  <Building2 className="size-6 text-white" />
                </div>
                <Button variant="outline" className="rounded-xl">
                  <Upload className="size-4" /> Upload logo
                </Button>
                <div className="text-[11px] text-muted-foreground mt-2">SVG, PNG · 512×512 min</div>
              </div>
            </div>
          </motion.div>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-primary" />
              <div className="text-sm font-semibold">AI profile score</div>
            </div>
            <div className="text-3xl font-semibold gradient-text">92%</div>
            <div className="text-xs text-muted-foreground mt-1">Add one industry certification to reach 100%.</div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Pill i={<Building2 className="size-3.5" />} l="Company" />
              <Pill i={<MapPin className="size-3.5" />} l="Geography" />
              <Pill i={<Phone className="size-3.5" />} l="Contact" />
              <Pill i={<Clock className="size-3.5" />} l="Hours" />
              <Pill i={<Globe2 className="size-3.5" />} l="Website" />
              <Pill i={<Mail className="size-3.5" />} l="Email" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ i, l }: { i: React.ReactNode; l: string }) {
  return (
    <div className="rounded-lg bg-card border border-border p-2 flex items-center gap-1.5">
      <span className="text-primary">{i}</span> {l}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="text-sm font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 block">{label}</Label>
      {children}
    </div>
  );
}