import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DiagnosticHosting } from "@/types/website";

interface HostingDashboardProps {
  hosting: DiagnosticHosting | null;
  isLoading: boolean;
}

export function HostingDashboard({ hosting, isLoading }: HostingDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Hosting Diagnostics</CardTitle></CardHeader>
        <CardContent><div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div></CardContent>
      </Card>
    );
  }

  if (!hosting) {
    return (
      <Card>
        <CardHeader><CardTitle>Hosting Diagnostics</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No hosting data available. Run a diagnostics scan.</p>
        </CardContent>
      </Card>
    );
  }

  const fields = [
    { label: "Hosting Provider", value: hosting.hosting_provider || "—" },
    { label: "Cloud Provider", value: hosting.cloud_provider || "—" },
    { label: "Server Software", value: hosting.server_software || "—" },
    { label: "PHP Version", value: hosting.php_version || "—" },
    { label: "Database Version", value: hosting.database_version || "—" },
    { label: "Memory Limit", value: hosting.memory_limit || "—" },
    { label: "Upload Limit", value: hosting.upload_limit || "—" },
    { label: "Execution Time", value: hosting.execution_time || "—" },
    { label: "CPU", value: hosting.cpu || "—" },
    { label: "Disk Usage", value: hosting.disk_usage || "—" },
    { label: "Storage", value: hosting.storage || "—" },
    { label: "Region", value: hosting.region || "—" },
    { label: "Timezone", value: hosting.timezone || "—" },
    { label: "Server Health", value: hosting.server_health },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hosting Diagnostics</CardTitle>
        <CardDescription>Server and hosting environment details</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {fields.map((field) => (
            <div key={field.label} className="flex justify-between items-center py-1">
              <span className="text-xs text-muted-foreground">{field.label}</span>
              <span className="font-medium text-sm">
                {field.value === "healthy" ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">{field.value}</Badge>
                ) : field.value === "unknown" ? (
                  <Badge variant="outline">{field.value}</Badge>
                ) : (
                  field.value
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}