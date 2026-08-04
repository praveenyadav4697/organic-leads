import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, ImageIcon, Type, Palette, FolderOpen, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, TextAreaInput } from "@/modules/website-foundation/components/form-field";
import { brandService } from "@/modules/website-foundation/services";
import type { BrandAsset } from "@/modules/website-foundation/types";
import { motion } from "framer-motion";

import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";

export const Route = createFileRoute("/_app/website-foundation/brand")({
  head: () => ({ meta: [{ title: "Brand Assets | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Brand Assets">
      <BrandAssets />
    </ErrorBoundary>
  ),
});

function BrandAssets() {
  const [asset, setAsset] = useState<BrandAsset | null>(null);
  useEffect(() => { brandService.get().then(setAsset); }, []);
  if (!asset) return <div className="h-40 rounded-2xl border border-border bg-card animate-pulse" />;

  const slots = [
    { label: "Primary logo", file: asset.logo },
    { label: "Dark logo", file: asset.darkLogo },
    { label: "Light logo", file: asset.lightLogo },
    { label: "Favicon", file: asset.favicon },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="size-4 text-primary" /> Logo & favicon</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {slots.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border p-4 bg-muted/20">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="mt-3 h-24 rounded-xl border border-dashed border-border grid place-items-center bg-muted/30">
                  <div className="text-center">
                    <ImageIcon className="size-5 text-muted-foreground mx-auto" />
                    <div className="text-xs mt-1">{s.file}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="outline" className="rounded-lg"><Upload className="size-3.5" /> Upload</Button>
                  <Button size="sm" variant="ghost" className="rounded-lg"><Eye className="size-3.5" /> Preview</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Palette className="size-4 text-primary" /> Brand colors</div>
          <div className="mt-4 space-y-3">
            <Field label="Primary">
              <div className="flex items-center gap-2">
                <input type="color" value={asset.primaryColor} className="size-10 rounded-lg border border-border bg-transparent" readOnly />
                <TextInput value={asset.primaryColor} readOnly />
              </div>
            </Field>
            <Field label="Secondary">
              <div className="flex items-center gap-2">
                <input type="color" value={asset.secondaryColor} className="size-10 rounded-lg border border-border bg-transparent" readOnly />
                <TextInput value={asset.secondaryColor} readOnly />
              </div>
            </Field>
          </div>
          <div className="mt-5 rounded-xl border border-border p-3" style={{ background: `linear-gradient(135deg, ${asset.primaryColor}, ${asset.secondaryColor})` }}>
            <div className="text-white text-sm font-semibold">Brand gradient</div>
            <div className="text-white/80 text-xs">Used for hero treatments, buttons, and gauge rings.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-semibold flex items-center gap-2"><Type className="size-4 text-primary" /> Typography</div>
          <div className="mt-4 space-y-3">
            <Field label="Heading font">
              <TextInput value={asset.typography.heading} readOnly />
            </Field>
            <Field label="Body font">
              <TextInput value={asset.typography.body} readOnly />
            </Field>
          </div>
          <div className="mt-5 rounded-xl border border-border p-3 bg-muted/20">
            <div className="text-2xl font-semibold" style={{ fontFamily: asset.typography.heading }}>Aa Bb Cc 123</div>
            <div className="text-sm text-muted-foreground mt-1" style={{ fontFamily: asset.typography.body }}>The quick brown fox jumps over the lazy dog.</div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold flex items-center gap-2"><FolderOpen className="size-4 text-primary" /> Media library</div>
            <Button size="sm" variant="outline" className="rounded-lg"><Upload className="size-3.5" /> Upload</Button>
          </div>
          <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-2">
            {Array.from({ length: 18 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="aspect-square rounded-lg border border-border bg-muted/30 grid place-items-center text-muted-foreground"
              >
                <ImageIcon className="size-4" />
              </motion.div>
            ))}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">{(asset.mediaCount ?? 0).toLocaleString()} assets in library</div>
          <div className="mt-5">
            <Field label="Preview block">
              <TextAreaInput placeholder="Add a description for the brand kit…" />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
