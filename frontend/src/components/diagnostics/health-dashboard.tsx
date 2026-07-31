import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import type { DiagnosticHealth } from "@/types/website";

interface HealthDashboardProps {
  health: DiagnosticHealth | null;
  isLoading: boolean;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${color}`}>{score}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const variant = grade === "excellent" ? "default" : grade === "good" ? "secondary" : grade === "fair" ? "outline" : "destructive";
  return <Badge variant={variant} className="capitalize text-lg px-4 py-1">{grade}</Badge>;
}

export function HealthDashboard({ health, isLoading }: HealthDashboardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Website Health</CardTitle></CardHeader>
        <CardContent><div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div></CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader><CardTitle>Website Health</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No health data available. Run a diagnostics scan.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Website Health Dashboard</CardTitle>
            <CardDescription>Overall health score and category breakdown</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <GradeBadge grade={health.grade} />
            <div className="text-4xl font-bold">{health.health_score}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <ScoreRing score={health.availability} label="Availability" />
          <ScoreRing score={health.ssl} label="SSL" />
          <ScoreRing score={health.dns} label="DNS" />
          <ScoreRing score={health.performance} label="Performance" />
          <ScoreRing score={health.plugins} label="Plugins" />
          <ScoreRing score={health.themes} label="Themes" />
          <ScoreRing score={health.security} label="Security" />
          <ScoreRing score={health.best_practices ?? 0} label="Best Practices" />
          <ScoreRing score={health.broken_links ?? 0 === 0 ? 100 : 0} label="Broken Links" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Recommendations</p>
          {health.recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues detected.</p>
          ) : (
            <ul className="space-y-1">
              {health.recommendations.map((rec, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-yellow-700">
                  <AlertTriangle className="size-4 shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Redirects:</span>{" "}
            <Badge variant={health.redirects > 5 ? "secondary" : "default"}>{health.redirects}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Robots.txt:</span>{" "}
            {health.robots ? <CheckCircle2 className="size-4 inline text-green-600" /> : <XCircle className="size-4 inline text-red-600" />}
          </div>
          <div>
            <span className="text-muted-foreground">Sitemap:</span>{" "}
            {health.sitemap ? <CheckCircle2 className="size-4 inline text-green-600" /> : <XCircle className="size-4 inline text-red-600" />}
          </div>
          <div>
            <span className="text-muted-foreground">Response Time:</span>{" "}
            <span>{health.response_time_ms !== null ? `${health.response_time_ms.toFixed(0)}ms` : "—"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}