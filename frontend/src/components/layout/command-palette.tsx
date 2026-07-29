import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navItems } from "@/lib/nav";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Search, Plus, FileBarChart } from "lucide-react";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const go = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, websites, actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/website-foundation")}>
            <Plus className="size-4" /> Add website
          </CommandItem>
          <CommandItem onSelect={() => go("/seo-analyzer")}>
            <Search className="size-4" /> Run SEO audit
          </CommandItem>
          <CommandItem onSelect={() => go("/reports")}>
            <FileBarChart className="size-4" /> Generate report
          </CommandItem>
          <CommandItem onSelect={() => go("/keywords")}>
            <Sparkles className="size-4" /> Generate keywords with AI
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {navItems.map((n) => (
            <CommandItem key={n.to} onSelect={() => go(n.to)}>
              <n.icon className="size-4" />
              {n.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
