import { Badge } from "@/components/ui/badge";
import type { FoundationProject } from "@/types/foundation";

interface StatusBadgeProps {
  project: FoundationProject;
}

export function ProjectStatusBadge({ project }: StatusBadgeProps) {
  const getVariant = () => {
    if (project.approval_status === "approved") return "default";
    if (project.approval_status === "rejected") return "destructive";
    if (project.approval_status === "changes_requested") return "secondary";
    return "outline";
  };

  return (
    <Badge variant={getVariant()} className="capitalize">
      {project.approval_status.replace("_", " ")}
    </Badge>
  );
}

export function VerificationBadge({
  project,
}: {
  project: FoundationProject;
}) {
  const isCompleted = project.verification_status === "completed";
  return (
    <Badge variant={isCompleted ? "default" : "outline"}>
      {isCompleted ? "Verified" : project.verification_status}
    </Badge>
  );
}

export function AuditBadge({ project }: { project: FoundationProject }) {
  const isCompleted = project.audit_status === "completed";
  return (
    <Badge variant={isCompleted ? "default" : "outline"}>
      {isCompleted ? "Audited" : project.audit_status}
    </Badge>
  );
}