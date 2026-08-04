import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ChangeEvent, type DragEvent } from "react";
import {
  Eye,
  Trash2,
  Upload,
  Search,
  Power,
  RefreshCw,
  Download,
  MoreHorizontal,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themeService } from "@/modules/website-foundation/services";
import { useThemes, useInstallTheme } from "@/hooks/useWebsite";
import type { Theme, ThemeDetail } from "@/modules/website-foundation/types";
import { UploadProgress } from "@/components/diagnostics/UploadProgress";
import { toast } from "sonner";

const MAX_UPLOAD_SIZE_MB = 50;

import { ErrorBoundary } from "@/modules/website-foundation/components/error-boundary";

export const Route = createFileRoute("/_app/website-foundation/themes")({
  head: () => ({ meta: [{ title: "Themes | Organic Leads" }] }),
  component: () => (
    <ErrorBoundary name="Themes">
      <ThemeManager />
    </ErrorBoundary>
  ),
});

function ThemeManager() {
  const [websiteId, setWebsiteId] = useState<string>("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    progress: number;
    status: "uploading" | "installing" | "success" | "error";
    error?: string;
  } | null>(null);

  const { data: themes = [], isLoading, refetch } = useThemes(websiteId);
  const installMutation = useInstallTheme();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await import("@/api/websiteApi").then((m) => m.websiteApi.list());
        if (res.items.length > 0) {
          setWebsiteId(res.items[0].id);
        }
      } catch {
        toast.error("No websites registered");
      }
    };
    init();
  }, []);

  const filtered = (themes || []).filter(
    (t) =>
      (filter === "all" ||
        (filter === "active") === (t.status === "active") ||
        (filter === "inactive") === (t.status === "inactive")) &&
      (t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.slug?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast.error("Invalid file type. Only .zip files are accepted.");
      return;
    }

    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > MAX_UPLOAD_SIZE_MB) {
      toast.error(`File exceeds maximum size of ${MAX_UPLOAD_SIZE_MB}MB`);
      return;
    }

    setUploadFile(file);
    setUploadProgress({ progress: 0, status: "uploading" });

    try {
      setUploadProgress({ progress: 50, status: "installing" });
      const formData = new FormData();
      formData.append("theme_file", file, file.name);
      await installMutation.mutateAsync({ websiteId, formData });
      setUploadProgress({ progress: 100, status: "success" });
      toast.success("Theme installed successfully");
      refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Theme upload failed";
      setUploadProgress({ progress: 0, status: "error", error: message });
    }
  };

  const handleActivate = async (theme: Theme) => {
    await themeService.activate(theme.slug);
    refetch();
  };

  const handleDelete = async (theme: Theme) => {
    await themeService.delete(theme.slug);
    refetch();
  };

  const handleUpdate = async (theme: Theme) => {
    await themeService.update(theme.slug);
    refetch();
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".zip")) {
        toast.error("Invalid file type. Only .zip files are accepted.");
        return;
      }
      const fileSizeMb = file.size / (1024 * 1024);
      if (fileSizeMb > MAX_UPLOAD_SIZE_MB) {
        toast.error(`File exceeds maximum size of ${MAX_UPLOAD_SIZE_MB}MB`);
        return;
      }
      setUploadFile(file);
      setUploadProgress({ progress: 0, status: "uploading" });

      const formData = new FormData();
      formData.append("theme_file", file, file.name);
      setUploadProgress({ progress: 30, status: "installing" });
      try {
        await installMutation.mutateAsync({ websiteId, formData });
        setUploadProgress({ progress: 100, status: "success" });
        toast.success("Theme installed successfully");
        refetch();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Theme upload failed";
        setUploadProgress({ progress: 0, status: "error", error: message });
      }
    }
  };

  useEffect(() => {
    if (uploadProgress?.status === "success") {
      const timer = setTimeout(() => {
        setUploadProgress(null);
        setUploadFile(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadProgress?.status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                "px-3 h-9 rounded-xl text-xs font-medium capitalize border " +
                (filter === f
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:bg-muted/40")
              }
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9 rounded-xl h-9 w-56"
              placeholder="Search themes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            className="rounded-xl gradient-primary text-white border-0"
            onClick={() => document.getElementById("theme-upload-btn")?.click()}
          >
            <Upload className="size-4" />
            Upload theme
            <Input
              id="theme-upload-btn"
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              onChange={handleUpload}
            />
          </Button>
          <Button variant="outline" className="rounded-xl">
            <Download className="size-4" />
            Theme history
          </Button>
        </div>
      </div>

      {uploadFile && uploadProgress && (
        <UploadProgress
          fileName={uploadFile.name}
          fileSize={uploadFile.size}
          progress={uploadProgress.progress}
          status={uploadProgress.status}
          error={uploadProgress.error}
          onCancel={() => {
            setUploadFile(null);
            setUploadProgress(null);
          }}
        />
      )}

      {!uploadFile && (
        <div
          className="border-2 border-dashed rounded-2xl border-border p-6 text-center cursor-pointer hover:bg-muted/20 transition"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById("theme-upload-drop")?.click()}
        >
          <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">Drag & drop a .zip theme file, or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">
            Maximum file size: {MAX_UPLOAD_SIZE_MB}MB
          </p>
          <Input
            id="theme-upload-drop"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      )}

      {filtered.length === 0 && !isLoading && !uploadFile && (
        <div className="text-center py-12">
          <Palette className="size-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No themes found.</p>
          {themes?.length === 0 && (
            <p className="text-sm text-muted-foreground mt-1">Install a theme to get started.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((theme) => (
          <ThemeCard
            key={theme.slug || theme.id}
            theme={theme}
            onActivate={handleActivate}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            onDetails={() => setSelectedTheme(theme)}
          />
        ))}
      </div>

      <ThemeDetailDialog
        theme={selectedTheme}
        onClose={() => setSelectedTheme(null)}
        onActivate={handleActivate}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

function ThemeCard({
  theme,
  onActivate,
  onDelete,
  onUpdate,
  onDetails,
}: {
  theme: Theme;
  onActivate: (theme: Theme) => void;
  onDelete: (theme: Theme) => void;
  onUpdate: (theme: Theme) => void;
  onDetails: (theme: Theme) => void;
}) {
  const isActive = theme.status === "active";
  const hasUpdate = theme.version !== "unknown" && theme.lastUpdated;

  return (
    <Card className="relative group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {theme.screenshot ? (
              <img
                src={theme.screenshot}
                alt={theme.name}
                className="size-12 rounded-lg object-cover"
              />
            ) : (
              <div className="size-12 rounded-lg bg-muted/40 grid place-items-center text-primary">
                <span className="text-[11px] font-semibold">
                  {theme.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <CardTitle className="text-base">{theme.name}</CardTitle>
              <CardDescription className="text-xs">v{theme.version}</CardDescription>
            </div>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {theme.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{theme.description}</p>
        )}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          {theme.author && (
            <div>
              <span className="text-muted-foreground">Author:</span> {theme.author}
            </div>
          )}
          {theme.license && (
            <div>
              <span className="text-muted-foreground">License:</span> {theme.license}
            </div>
          )}
          {theme.requiresWp && (
            <div>
              <span className="text-muted-foreground">Requires WP:</span> {theme.requiresWp}
            </div>
          )}
          {theme.requiresPhp && (
            <div>
              <span className="text-muted-foreground">Requires PHP:</span> {theme.requiresPhp}
            </div>
          )}
        </div>
      </CardContent>

      <CardContent className="flex items-center justify-between pt-0">
        <div className="flex items-center gap-2">
          {!isActive && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg h-8"
              onClick={() => onActivate(theme)}
            >
              <Power className="size-3.5 mr-1" /> Activate
            </Button>
          )}
          {hasUpdate && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg h-8"
              onClick={() => onUpdate(theme)}
            >
              <Download className="size-3.5 mr-1" /> Update
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="rounded-lg h-8"
            onClick={() => onDetails(theme)}
          >
            <Eye className="size-3.5" />
          </Button>
        </div>

        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="rounded-lg h-8">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isActive && (
                <DropdownMenuItem onClick={() => onActivate(theme)}>Activate</DropdownMenuItem>
              )}
              {hasUpdate && (
                <DropdownMenuItem onClick={() => onUpdate(theme)}>Update</DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDetails(theme)}>Details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete theme "{theme.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The theme will be permanently removed from the
                WordPress site.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground"
                onClick={() => onDelete(theme)}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function ThemeDetailDialog({
  theme,
  onClose,
  onActivate,
  onDelete,
  onUpdate,
  onRefresh,
}: {
  theme: Theme | null;
  onClose: () => void;
  onActivate: (theme: Theme) => void;
  onDelete: (theme: Theme) => void;
  onUpdate: (theme: Theme) => void;
  onRefresh: () => void;
}) {
  const [details, setDetails] = useState<ThemeDetail | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!theme?.slug) return;
    try {
      const d = await themeService.getDetails(theme.slug);
      setDetails(d as unknown as ThemeDetail);
    } catch {
      onRefresh();
    }
  }, [theme, onRefresh]);

  useEffect(() => {
    if (theme) fetchDetails();
  }, [theme, fetchDetails]);

  const handleActivate = () => {
    if (theme) {
      onActivate(theme);
      onClose();
    }
  };

  const handleDelete = () => {
    if (theme) {
      onDelete(theme);
      onClose();
    }
  };

  const handleUpdate = () => {
    if (theme) {
      onUpdate(theme);
      onClose();
    }
  };

  if (!theme) return null;

  return (
    <Dialog open={!!theme} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{theme.name}</DialogTitle>
          <DialogDescription>
            v{theme.version} — {theme.status}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {details && (
              <>
                {details.author && (
                  <div>
                    <span className="text-muted-foreground">Author:</span> {details.author}
                  </div>
                )}
                {details.author_uri && (
                  <div>
                    <span className="text-muted-foreground">Author URI:</span>{" "}
                    <a
                      href={details.author_uri}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {details.author_uri}
                    </a>
                  </div>
                )}
                {details.theme_uri && (
                  <div>
                    <span className="text-muted-foreground">Theme URI:</span> {details.theme_uri}
                  </div>
                )}
                {details.license && (
                  <div>
                    <span className="text-muted-foreground">License:</span> {details.license}
                  </div>
                )}
                {details.requires_wp && (
                  <div>
                    <span className="text-muted-foreground">Requires WP:</span>{" "}
                    {details.requires_wp}
                  </div>
                )}
                {details.requires_php && (
                  <div>
                    <span className="text-muted-foreground">Requires PHP:</span>{" "}
                    {details.requires_php}
                  </div>
                )}
                {details.tested_wp && (
                  <div>
                    <span className="text-muted-foreground">Tested WP:</span> {details.tested_wp}
                  </div>
                )}
                {details.text_domain && (
                  <div>
                    <span className="text-muted-foreground">Text Domain:</span>{" "}
                    {details.text_domain}
                  </div>
                )}
                {details.parent && (
                  <div>
                    <span className="text-muted-foreground">Parent:</span> {details.parent}
                  </div>
                )}
                {details.average_rating !== undefined && details.average_rating !== null && (
                  <div>
                    <span className="text-muted-foreground">Rating:</span> {details.average_rating}
                    /100
                  </div>
                )}
              </>
            )}
          </div>

          {details?.tags && details.tags.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {details.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={onClose}>
            Close
          </Button>
          {theme.status !== "active" && (
            <Button
              size="sm"
              className="rounded-lg gradient-primary text-white border-0"
              onClick={handleActivate}
            >
              <Power className="size-3.5 mr-1" /> Activate
            </Button>
          )}
          <Button variant="outline" size="sm" className="rounded-lg" onClick={handleUpdate}>
            <Download className="size-3.5 mr-1" /> Update
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="rounded-lg">
                <Trash2 className="size-3.5 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete theme "{theme.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The theme will be permanently removed from the
                  WordPress site.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground"
                  onClick={handleDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}
