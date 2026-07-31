import type { MobileTestCreate } from "@/modules/mobile/types";
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
  url: z.string().url(),
  device_type: z.enum(["mobile", "tablet", "desktop"]),
});

type FormData = z.infer<typeof schema>;

interface MobileTestDialogProps {
  onSubmit: (data: MobileTestCreate) => void;
}

export function MobileTestDialog({ onSubmit }: MobileTestDialogProps) {
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
        <Button>New Test</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mobile Readiness Test</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input {...register("url")} placeholder="https://example.com" />
          <Button type="submit">Run Test</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}