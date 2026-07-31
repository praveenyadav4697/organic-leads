import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { DiagnosticSSL } from "@/types/website";

interface SSLDashboardProps {
  ssl: DiagnosticSSL | null;
  isLoading: boolean;
}

export function SSLDashboard({ ssl, isLoading }: SSLDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>SSL/TLS Diagnostics</CardTitle></CardHeader>
        <CardContent><div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div></CardContent>
      </Card>
    );
  }

  if (!ssl) {
    return (
      <Card>
        <CardHeader><CardTitle>SSL/TLS Diagnostics</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No SSL diagnostic data available. Run a diagnostics scan.</p>
        </CardContent>
      </Card>
    );
  }

  const ratingColor = ssl.security_rating === "A" ? "text-green-600" : ssl.security_rating === "B" ? "text-blue-600" : ssl.security_rating === "C" ? "text-yellow-600" : "text-red-600";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>SSL/TLS Diagnostics</CardTitle>
          <CardDescription>HTTPS configuration and certificate details</CardDescription>
        </div>
        <div className={`text-3xl font-bold ${ratingColor}`}>{ssl.security_rating}</div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">HTTPS Enabled</p>
            <p className="font-medium">{ssl.https_enabled ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Certificate Valid</p>
            <p className="font-medium flex items-center gap-1">
              {ssl.valid ? <CheckCircle2 className="size-4 text-green-600" /> : <XCircle className="size-4 text-red-600" />}
              {ssl.valid ? "Valid" : "Invalid"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Issuer</p>
            <p className="font-medium text-sm">{ssl.issuer || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">TLS Version</p>
            <p className="font-medium">{ssl.tls_version || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expires At</p>
            <p className="font-medium text-sm">{ssl.expires_at ? new Date(ssl.expires_at).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Days Until Expiry</p>
            <p className={`font-medium ${(ssl.days_until_expiry ?? 999) <= 30 ? "text-red-600" : "text-green-600"}`}>
              {ssl.days_until_expiry !== null ? `${ssl.days_until_expiry} days` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">HSTS Enabled</p>
            <p className="font-medium">{ssl.hsts_enabled ? "Yes" : "No"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mixed Content Issues</p>
            <p className={`font-medium ${ssl.mixed_content_count > 0 ? "text-red-600" : "text-green-600"}`}>
              {ssl.mixed_content_count}
            </p>
          </div>
        </div>
        {ssl.error_message && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 flex items-center gap-2">
            <XCircle className="size-4 shrink-0" />
            {ssl.error_message}
          </div>
        )}
        {(ssl.days_until_expiry !== null && ssl.days_until_expiry <= 30) && (
          <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-700 flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            Certificate expires within 30 days. Renew immediately.
          </div>
        )}
      </CardContent>
    </Card>
  );
}