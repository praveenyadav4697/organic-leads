import { useState, useMemo } from "react";
import { useBusinessProfiles } from "@/hooks/useBusiness";
import { useBusinessProfile } from "@/hooks/useBusiness";
import { useCreateBusinessProfile } from "@/hooks/useBusiness";
import { useUpdateBusinessProfile } from "@/hooks/useBusiness";
import { useDeleteBusinessProfile } from "@/hooks/useBusiness";
import { BusinessProfileCard } from "@/components/business/profile-card";
import { BusinessProfileDialog } from "@/components/business/profile-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, RefreshCw } from "lucide-react";

function BusinessDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch } = useBusinessProfiles({
    page,
    page_size: 10,
  });

  const createProfile = useCreateBusinessProfile({
    onSuccess: () => {
      toast.success("Business profile created");
      refetch();
    },
    onError: () => toast.error("Failed to create profile"),
  });

  const deleteProfile = useDeleteBusinessProfile({
    onSuccess: () => toast.success("Profile deleted"),
    onError: () => toast.error("Failed to delete profile"),
  });

  const items = data?.items ?? [];
  const filteredProfiles = useMemo(
    () => items.filter((p) => p.business_name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  return (
    <div className="space-y-6">
      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive flex items-center justify-between">
          <span>Failed to load business profiles — the backend may be unreachable.</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Manage business profiles, track competitors, and research keywords.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1">
            <RefreshCw className="size-3" /> Refresh
          </Button>
          <BusinessProfileDialog onSubmit={(data) => createProfile.mutate(data)}>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="size-3" /> New Profile
            </Button>
          </BusinessProfileDialog>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search profiles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm font-medium text-foreground">No profiles found.</p>
          <p className="text-xs mt-1 text-muted-foreground">Create a new business profile to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProfiles.map((profile) => (
            <BusinessProfileCard
              key={profile.id}
              profile={profile}
              onDelete={deleteProfile.mutate}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredProfiles.length} of {data?.total ?? 0} profiles
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="px-2 py-1 text-xs">Page {page} of {data?.total_pages ?? 1}</span>
          <Button variant="outline" size="sm" disabled={page >= (data?.total_pages ?? 1)} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BusinessDashboard;
