import type { PerformanceCheckCreate } from "@/modules/performance/types";
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
});

type FormData = z.infer<typeof schema>;

interface PerformanceCheckDialogProps {
  onSubmit: (data: PerformanceCheckCreate) => void;
}

export function PerformanceCheckDialog({ onSubmit }: PerformanceCheckDialogProps) {
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
        <Button>New Check</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Performance Check</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input {...register("url")} placeholder="https://example.com" />
          <Button type="submit">Check</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}