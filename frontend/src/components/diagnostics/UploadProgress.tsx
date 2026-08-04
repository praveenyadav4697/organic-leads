import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Upload, CheckCircle, AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export type UploadStatus = "uploading" | "installing" | "success" | "error";

export interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  status: UploadStatus;
  error?: string;
  onCancel?: () => void;
}

const statusConfig: Record<UploadStatus, { label: string; icon: ReactNode; color: string }> = {
  uploading: { label: "Uploading…", icon: <Upload className="size-4" />, color: "text-primary" },
  installing: {
    label: "Installing…",
    icon: <Upload className="size-4 animate-pulse" />,
    color: "text-primary",
  },
  success: { label: "Installed", icon: <CheckCircle className="size-4" />, color: "text-success" },
  error: { label: "Failed", icon: <AlertCircle className="size-4" />, color: "text-destructive" },
};

export function UploadProgress({
  fileName,
  fileSize,
  progress,
  status,
  error,
  onCancel,
}: UploadProgressProps) {
  const cfg = statusConfig[status];
  const formattedSize =
    fileSize < 1024
      ? `${fileSize} B`
      : fileSize < 1024 * 1024
        ? `${(fileSize / 1024).toFixed(1)} KB`
        : `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className={cn("shrink-0", cfg.color)}>{cfg.icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{fileName}</div>
          <div className="text-xs text-muted-foreground">{formattedSize}</div>
        </div>
        <div className="text-xs font-medium">{cfg.label}</div>
        {status !== "success" && status !== "error" && onCancel && (
          <Button size="sm" variant="ghost" className="rounded-lg h-7 w-7 p-0" onClick={onCancel}>
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      <Progress value={progress} className="h-2" />

      {status === "error" && error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
