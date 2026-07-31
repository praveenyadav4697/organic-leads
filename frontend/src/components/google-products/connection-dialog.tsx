import type { GoogleProductConnectionCreate } from "@/modules/google-products/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const schema = z.object({
  product_type: z.string().min(1),
  product_name: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

interface GoogleProductConnectionDialogProps {
  onSubmit: (data: GoogleProductConnectionCreate) => void;
}

export function GoogleProductConnectionDialog({ onSubmit }: GoogleProductConnectionDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      connection_status: "pending",
      is_active: false,
      created_by: "current_user",
    });
    reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Connect Product</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Google Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input {...register("product_name")} placeholder="Product name" />
          <Button type="submit">Connect</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}