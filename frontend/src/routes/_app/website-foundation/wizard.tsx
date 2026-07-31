import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Box, Check, FileText, ImageIcon, Server, Shield, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Switch } from "@/modules/website-foundation/components/form-field";
import { Wizard, type WizardStep } from "@/modules/website-foundation/components/wizard";
import { useCreateWebsite } from "@/hooks/useWebsite";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/website-foundation/wizard")({
  head: () => ({ meta: [{ title: "Website Wizard — Nebula" }] }),
  component: WebsiteWizard,
});

function WebsiteWizard() {
  const navigate = useNavigate();
  const createWebsite = useCreateWebsite();
  const [data, setData] = useState({
    name: "",
    url: "",
    domain: "",
    protocol: "https" as "https" | "http",
    hostingProvider: "",
    hostingType: "cloud" as "shared" | "cloud" | "dedicated" | "vps",
    hostingUsername: "",
    hostingPassword: "",
    accessProtocol: "sftp" as "ftp" | "sftp" | "ssh",
    wpAdminUrl: "",
    wpUsername: "",
    wpAppPassword: "",
    restApiStatus: "active" as "active" | "inactive",
    xmlrpcStatus: "disabled" as "enabled" | "disabled",
    logo: "",
    darkLogo: "",
    lightLogo: "",
    favicon: "",
    primaryColor: "#6366f1",
    secondaryColor: "#22d3ee",
    fonts: "Inter",
    brandGuidelinesPdf: "",
    currentTheme: "",
    childTheme: "",
    themeVersion: "",
    themeLicense: "",
    selectedPlugins: [] as string[],
  });

  const update = (k: keyof typeof data, v: any) => setData((d) => ({ ...d, [k]: v }));
  const togglePlugin = (p: string) =>
    setData((d) => ({ ...d, selectedPlugins: d.selectedPlugins.includes(p) ? d.selectedPlugins.filter((x) => x !== p) : [...d.selectedPlugins, p] }));

  const steps: WizardStep[] = [
    {
      id: "site",
      title: "Website identity",
      description: "Tell us about the website you want to register.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Website name" required>
            <TextInput value={data.name} onChange={(e) => update("name", e.target.value)} placeholder="Acme Marketing Site" />
          </Field>
          <Field label="Website URL" required>
            <TextInput value={data.url} onChange={(e) => update("url", e.target.value)} placeholder="https://example.com" />
          </Field>
          <Field label="Domain" required>
            <TextInput value={data.domain} onChange={(e) => update("domain", e.target.value)} placeholder="example.com" />
          </Field>
          <Field label="Protocol">
            <div className="flex gap-2">
              {(["https", "http"] as const).map((p) => (
                <button key={p} type="button" onClick={() => update("protocol", p)} className={
                  "px-4 h-10 rounded-xl text-sm font-medium border " + (data.protocol === p ? "bg-primary text-white border-primary" : "bg-card hover:bg-muted/40")
                }>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </Field>
        </div>
      ),
    },
    {
      id: "hosting",
      title: "Hosting & access",
      description: "Connect your hosting environment securely.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Hosting provider" required>
            <TextInput value={data.hostingProvider} onChange={(e) => update("hostingProvider", e.target.value)} />
          </Field>
          <Field label="Hosting type">
            <div className="grid grid-cols-4 gap-2">
              {(["shared", "cloud", "dedicated", "vps"] as const).map((t) => (
                <button key={t} type="button" onClick={() => update("hostingType", t)} className={
                  "h-10 rounded-xl text-xs font-medium border capitalize " + (data.hostingType === t ? "bg-primary text-white border-primary" : "bg-card hover:bg-muted/40")
                }>{t}</button>
              ))}
            </div>
          </Field>
          <Field label="Hosting username">
            <TextInput value={data.hostingUsername} onChange={(e) => update("hostingUsername", e.target.value)} />
          </Field>
          <Field label="Hosting password" hint="Stored encrypted with AES-256-GCM.">
            <TextInput type="password" value={data.hostingPassword} onChange={(e) => update("hostingPassword", e.target.value)} placeholder="••••••••" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Access protocol">
              <div className="flex gap-2">
                {(["ftp", "sftp", "ssh"] as const).map((p) => (
                  <button key={p} type="button" onClick={() => update("accessProtocol", p)} className={
                    "px-4 h-10 rounded-xl text-sm font-medium border uppercase " + (data.accessProtocol === p ? "bg-primary text-white border-primary" : "bg-card hover:bg-muted/40")
                  }>{p}</button>
                ))}
              </div>
            </Field>
          </div>
        </div>
      ),
    },
    {
      id: "wordpress",
      title: "WordPress connection",
      description: "Connect to your WordPress admin and REST API.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Admin URL" required>
            <TextInput value={data.wpAdminUrl} onChange={(e) => update("wpAdminUrl", e.target.value)} />
          </Field>
          <Field label="Username" required>
            <TextInput value={data.wpUsername} onChange={(e) => update("wpUsername", e.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Application password" hint="Generate via Users → Application Passwords in WP admin.">
              <TextInput type="password" value={data.wpAppPassword} onChange={(e) => update("wpAppPassword", e.target.value)} placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" />
            </Field>
          </div>
          <div className="rounded-xl border border-border p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">REST API</div>
              <div className="text-xs text-muted-foreground">HTTP /wp-json/</div>
            </div>
            <Switch checked={data.restApiStatus === "active"} onCheckedChange={(v) => update("restApiStatus", v ? "active" : "inactive")} />
          </div>
          <div className="rounded-xl border border-border p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">XML-RPC</div>
              <div className="text-xs text-muted-foreground">Recommended: disabled</div>
            </div>
            <Switch checked={data.xmlrpcStatus === "enabled"} onCheckedChange={(v) => update("xmlrpcStatus", v ? "enabled" : "disabled")} />
          </div>
        </div>
      ),
    },
    {
      id: "brand",
      title: "Brand assets",
      description: "Upload logos, colors, and typography.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            ["Primary logo", "logo"],
            ["Dark logo", "darkLogo"],
            ["Light logo", "lightLogo"],
            ["Favicon", "favicon"],
          ] as const).map(([label, key]) => (
            <Field key={key} label={label}>
              <div className="rounded-xl border border-dashed border-border p-3 flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted/40 grid place-items-center text-muted-foreground">
                  <ImageIcon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{data[key]}</div>
                  <div className="text-[11px] text-muted-foreground">SVG / PNG, max 2MB</div>
                </div>
                <Button size="sm" variant="outline" className="rounded-lg"><Upload className="size-3.5" /> Upload</Button>
              </div>
            </Field>
          ))}
          <Field label="Primary color">
            <div className="flex items-center gap-2">
              <input type="color" value={data.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="size-10 rounded-lg border border-border bg-transparent" />
              <TextInput value={data.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} />
            </div>
          </Field>
          <Field label="Secondary color">
            <div className="flex items-center gap-2">
              <input type="color" value={data.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} className="size-10 rounded-lg border border-border bg-transparent" />
              <TextInput value={data.secondaryColor} onChange={(e) => update("secondaryColor", e.target.value)} />
            </div>
          </Field>
          <Field label="Fonts">
            <TextInput value={data.fonts} onChange={(e) => update("fonts", e.target.value)} placeholder="Inter, IBM Plex Sans" />
          </Field>
          <Field label="Brand guidelines PDF">
            <div className="rounded-xl border border-dashed border-border p-3 flex items-center gap-3">
              <FileText className="size-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{data.brandGuidelinesPdf}</div>
                <div className="text-[11px] text-muted-foreground">PDF, max 10MB</div>
              </div>
              <Button size="sm" variant="outline" className="rounded-lg"><Upload className="size-3.5" /> Upload</Button>
            </div>
          </Field>
        </div>
      ),
    },
    {
      id: "theme",
      title: "Theme selection",
      description: "Choose the parent and child theme.",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Current theme">
            <TextInput value={data.currentTheme} onChange={(e) => update("currentTheme", e.target.value)} />
          </Field>
          <Field label="Child theme">
            <TextInput value={data.childTheme} onChange={(e) => update("childTheme", e.target.value)} />
          </Field>
          <Field label="Theme version">
            <TextInput value={data.themeVersion} onChange={(e) => update("themeVersion", e.target.value)} />
          </Field>
          <Field label="Theme license">
            <TextInput value={data.themeLicense} onChange={(e) => update("themeLicense", e.target.value)} />
          </Field>
          <div className="md:col-span-2 rounded-xl border border-border p-4 bg-muted/20">
            <div className="text-sm font-medium">Theme preview</div>
            <div className="text-xs text-muted-foreground">Render a live preview of the selected theme.</div>
            <div className="mt-3 aspect-video rounded-xl bg-muted/40 grid place-items-center text-muted-foreground text-xs">
              Live preview will render here
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "plugins",
      title: "Required plugins",
      description: "Select plugins to install and configure.",
      content: (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {["Rank Math SEO", "WP Rocket", "Wordfence", "MonsterInsights", "WPForms", "Akismet", "UpdraftPlus", "Smush"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlugin(p)}
                className={
                  "rounded-xl border p-3 text-left transition flex items-center gap-3 " +
                  (data.selectedPlugins.includes(p) ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30")
                }
              >
                <div className={"size-5 rounded-md grid place-items-center border " + (data.selectedPlugins.includes(p) ? "bg-primary text-white border-primary" : "border-border")}>
                  {data.selectedPlugins.includes(p) && <Check className="size-3" />}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{p}</div>
                  <div className="text-[11px] text-muted-foreground">Recommended</div>
                </div>
                <Sparkles className="size-4 text-primary" />
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-3.5" /> Selected plugins will be installed and activated after setup.
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl gradient-primary grid place-items-center text-white">
          <Sparkles className="size-4" />
        </div>
        <div>
          <div className="text-sm font-semibold">Setup wizard</div>
          <div className="text-xs text-muted-foreground">Six guided steps to onboard a new website.</div>
        </div>
      </div>
      <Wizard steps={steps} onFinish={async () => {
        try {
          await createWebsite.mutateAsync({
            name: data.name,
            url: data.url,
            domain: data.domain,
            protocol: data.protocol,
            hostingProvider: data.hostingProvider,
            hostingType: data.hostingType,
            hostingUsername: data.hostingUsername,
            hostingPassword: data.hostingPassword,
            accessProtocol: data.accessProtocol,
            wpAdminUrl: data.wpAdminUrl,
            wpUsername: data.wpUsername,
            wpAppPassword: data.wpAppPassword,
            wpRestApiStatus: data.restApiStatus,
            wpXmlrpcStatus: data.xmlrpcStatus,
          });
          toast.success("Website registered successfully");
          navigate({ to: "/website-foundation/overview" });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Registration failed");
        }
      }} finishLabel="Finish setup" />
    </div>
  );
}
