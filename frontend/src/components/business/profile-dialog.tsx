import type { BusinessProfileCreate } from "@/modules/business/types";
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
  business_name: z.string().min(1),
  primary_domain: z.string().min(1),
  business_type: z.string().optional(),
  website_url: z.string().url().optional(),
  description: z.string().optional(),
  country: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface BusinessProfileDialogProps {
  onSubmit: (data: BusinessProfileCreate) => void;
}

export function BusinessProfileDialog({ onSubmit }: BusinessProfileDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      created_by: "current_user",
    });
    reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Business Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input {...register("business_name")} placeholder="Business Name" />
          <Input {...register("primary_domain")} placeholder="Primary Domain" />
          <Input {...register("business_type")} placeholder="Business Type" />
          <Input {...register("website_url")} placeholder="Website URL" />
          <Button type="submit">Create</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}