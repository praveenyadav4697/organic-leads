import type { SearchConsolePropertyCreate } from "@/modules/search-console/types";
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
  property_id: z.string().min(1),
  property_name: z.string().min(1),
  site_url: z.string().url(),
  property_type: z.enum(["website", "youtube_channel", "app"]),
});

type FormData = z.infer<typeof schema>;

interface SearchConsolePropertyDialogProps {
  onSubmit: (data: SearchConsolePropertyCreate) => void;
}

export function SearchConsolePropertyDialog({ onSubmit }: SearchConsolePropertyDialogProps) {
  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      property_id: data.property_id,
      property_name: data.property_name,
      property_type: data.property_type,
      site_url: data.site_url,
      permission_level: "siteFull",
      site_ownership: "sole",
      verification_method: null,
      connection_status: "pending-verification",
      created_by: "current_user",
    });
    reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Connect Property</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect Search Console Property</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <Input {...register("property_id")} placeholder="Property ID" />
          <Input {...register("property_name")} placeholder="Property Name" />
          <Input {...register("site_url")} placeholder="Site URL" />
          <Button type="submit">Connect</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}