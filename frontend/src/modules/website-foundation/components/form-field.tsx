import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn("rounded-xl h-10", props.className)} />;
}

export function TextAreaInput(props: React.ComponentProps<typeof Textarea>) {
  return <Textarea {...props} className={cn("rounded-xl", props.className)} />;
}

export function Switch({ checked, onCheckedChange, label }: { checked: boolean; onCheckedChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex items-center gap-2 px-1 py-0.5 rounded-full transition",
        checked && "text-primary",
      )}
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition",
          checked ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
            checked ? "left-4" : "left-0.5",
          )}
        />
      </span>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </button>
  );
}
