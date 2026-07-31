import type { AuditRunCreate } from "@/modules/audit/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  audit_name: z.string().min(1),
  audit_type: z.enum(["full", "quick", "custom"]),
});

type FormData = z.infer<typeof schema>;

interface AuditRunDialogProps {
  onSubmit: (data: AuditRunCreate) => void;
}

export function AuditRunDialog({ onSubmit }: AuditRunDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New Audit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start SEO Audit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input {...register("audit_name")} placeholder="Audit name" />
          <Button type="submit">Start Audit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}