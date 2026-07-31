import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { ScanStatusEnum } from "@/types/website";

interface ScanProgressProps {
  status: string;
  progress: number;
  currentStep?: string;
  isLoading: boolean;
}

export function ScanProgress({ status, progress, currentStep, isLoading }: ScanProgressProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Scan Progress</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4 mt-2" /></CardContent>
      </Card>
    );
  }

  const statusIcon = {
    running: <Loader2 className="size-4 animate-spin text-blue-500" />,
    completed: <CheckCircle2 className="size-4 text-green-500" />,
    failed: <XCircle className="size-4 text-red-500" />,
    queued: <Clock className="size-4 text-yellow-500" />,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Scan Progress</CardTitle>
        <div className="flex items-center gap-2">
          {statusIcon[status as keyof typeof statusIcon] || <Clock className="size-4 text-muted-foreground" />}
          <Badge variant={status === "completed" ? "default" : status === "failed" ? "destructive" : "secondary"} className="capitalize">
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="w-full" />
        {currentStep && (
          <p className="text-xs text-muted-foreground">Step: {currentStep}</p>
        )}
      </CardContent>
    </Card>
  );
}