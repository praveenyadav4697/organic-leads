import type { SEOAuditFinding } from "@/modules/onpage-seo/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { STATUS_COLORS, SEVERITY_COLORS } from "@/modules/onpage-seo/constants";

interface SEOAuditTabProps {
  findings: SEOAuditFinding[];
  isLoading: boolean;
}

export function SEOAuditTab({ findings, isLoading }: SEOAuditTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="skeleton h-4 w-48 mb-2" />
            <div className="skeleton h-3 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle2 className="size-10 text-success mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No audit findings.</p>
        <p className="text-xs text-muted-foreground mt-1">Run an SEO audit to see results.</p>
      </Card>
    );
  }

  const passed = findings.filter((f) => f.status === "passed");
  const failed = findings.filter((f) => f.status === "failed");
  const warnings = findings.filter((f) => f.status === "warning");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline" className={STATUS_COLORS.passed}>{passed.length} Passed</Badge>
        <Badge variant="outline" className={STATUS_COLORS.failed}>{failed.length} Failed</Badge>
        <Badge variant="outline" className={STATUS_COLORS.warning}>{warnings.length} Warnings</Badge>
      </div>
      <div className="space-y-2">
        {findings.map((finding) => (
          <Card key={finding.id} className="p-3">
            <div className="flex items-start gap-3">
              {finding.status === "passed" && <CheckCircle2 className="size-4 text-success mt-0.5" />}
              {finding.status === "failed" && <XCircle className="size-4 text-destructive mt-0.5" />}
              {finding.status === "warning" && <AlertTriangle className="size-4 text-warning-foreground mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={SEVERITY_COLORS[finding.severity]}>{finding.severity}</Badge>
                  <span className="text-xs text-muted-foreground">{finding.category}</span>
                </div>
                <div className="text-sm font-medium">{finding.check_name}</div>
                <div className="text-xs text-muted-foreground mt-1">{finding.message}</div>
                {finding.recommendation && (
                  <div className="text-xs text-primary mt-1">{finding.recommendation}</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}