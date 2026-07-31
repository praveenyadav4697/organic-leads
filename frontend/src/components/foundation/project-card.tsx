import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Play,
  Trash2,
  Edit3,
} from "lucide-react";
import type { FoundationProject } from "@/types/foundation";

interface ProjectCardProps {
  project: FoundationProject;
  onDelete?: (id: string) => void;
}

const statusColors = {
  draft: "secondary",
  active: "default",
  paused: "outline",
  archived: "secondary",
} as const;

const approvalColors = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  changes_requested: "secondary",
} as const;

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const isCompleted =
    project.verification_status === "completed" &&
    project.audit_status === "completed";

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              {project.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {project.domain}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Badge variant={statusColors[project.status]}>{project.status}</Badge>
            <Badge variant={project.approval_status === "approved" ? "default" : "outline"}>
              {project.approval_status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          {isCompleted ? (
            <Badge variant="outline" className="text-success border-success/30">
              <CheckCircle2 className="size-3 mr-1" /> Verified & Audited
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="size-3 mr-1" /> Pending
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/website-foundation/projects/${project.id}`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Edit3 className="size-3" /> View
            </Button>
          </Link>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(project.id)}
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}