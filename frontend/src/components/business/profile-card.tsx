import type { BusinessProfile } from "@/modules/business/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface BusinessProfileCardProps {
  profile: BusinessProfile;
  onDelete: (id: string) => void;
}

export function BusinessProfileCard({ profile, onDelete }: BusinessProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{profile.business_name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{profile.primary_domain}</p>
        <StatusBadge status="active" />
        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm">View</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(profile.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}