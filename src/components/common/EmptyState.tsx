import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  className,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-surface-muted text-text-tertiary">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-xs text-text-tertiary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
