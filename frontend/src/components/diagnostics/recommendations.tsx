import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Info, XCircle, Zap } from "lucide-react";

interface RecommendationsProps {
  recommendations: string[];
  isLoading: boolean;
  brokenLinks?: number | null;
  redirects?: number;
  robots?: boolean | null;
  sitemap?: boolean | null;
}

export function Recommendations({ recommendations, isLoading, brokenLinks, redirects, robots, sitemap }: RecommendationsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-3/4 mt-2" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Recommendations &amp; Warnings</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {recommendations.length > 0 ? (
          <div>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-yellow-700">
                  <AlertTriangle className="size-4 shrink-0" /> {rec}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Info className="size-4" /> No outstanding recommendations.
          </div>
        )}
        {brokenLinks !== null && brokenLinks !== undefined && brokenLinks > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="size-4" /> {brokenLinks} broken link(s) detected.
          </div>
        )}
        {redirects !== undefined && redirects > 5 && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <Zap className="size-4" /> {redirects} redirects detected.
          </div>
        )}
        {robots === false && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <Info className="size-4" /> robots.txt is missing.
          </div>
        )}
        {sitemap === false && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <Info className="size-4" /> sitemap.xml is missing.
          </div>
        )}
      </CardContent>
    </Card>
  );
}