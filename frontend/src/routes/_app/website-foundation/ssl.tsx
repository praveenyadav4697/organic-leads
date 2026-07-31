import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShieldCheck, Server, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { websiteApi } from "@/api/websiteApi";
import { SSLDashboard } from "@/components/diagnostics/ssl-dashboard";
import { HostingDashboard } from "@/components/diagnostics/hosting-dashboard";

export const Route = createFileRoute("/_app/website-foundation/ssl")({
  head: () => ({ meta: [{ title: "SSL & Hosting Diagnostics — Nebula" }] }),
  component: SslHostingPage,
});

function SslHostingPage() {
  const websites = useQuery({ queryKey: ["websites"], queryFn: () => websiteApi.list() });
  const websiteId = websites.data?.items[0]?.id;
  const ssl = useQuery({ queryKey: ["ssl", websiteId], queryFn: () => websiteApi.getSslDiagnostics(websiteId!), enabled: !!websiteId, retry: false });
  const hosting = useQuery({ queryKey: ["hosting", websiteId], queryFn: () => websiteApi.getHostingDiagnostics(websiteId!), enabled: !!websiteId, retry: false });
  const scan = useMutation({ mutationFn: () => websiteApi.runDiagnostics(websiteId!), onSuccess: () => { ssl.refetch(); hosting.refetch(); } });
  const health = useQuery({ queryKey: ["health", websiteId], queryFn: () => websiteApi.getHealthDiagnostics(websiteId!), enabled: !!websiteId, retry: false });
  const brokenLinks = useQuery({ queryKey: ["broken-links", websiteId], queryFn: () => websiteApi.getBrokenLinks(websiteId!), enabled: !!websiteId, retry: false });

  if (websites.isLoading) return <Skeleton className="h-72 w-full rounded-xl" />;
  if (!websiteId) return <div className="rounded-xl border p-8 text-sm text-muted-foreground">Register a website before running diagnostics.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Website Diagnostics</h2>
          <p className="text-sm text-muted-foreground">SSL, hosting, health, and site integrity diagnostics.</p>
        </div>
        <Button onClick={() => scan.mutate()} disabled={scan.isPending}>
          <RefreshCw className="size-4" /> {scan.isPending ? "Scanning…" : "Run diagnostics"}
        </Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SSLDashboard ssl={ssl.data ?? null} isLoading={ssl.isLoading} />
        <HostingDashboard hosting={hosting.data ?? null} isLoading={hosting.isLoading} />
      </div>
      <Outlet />
    </div>
  );
}
