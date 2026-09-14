import { AlertTriangle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-12 text-center", className)}>
      <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <AlertTriangle className="size-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-text-primary">{title}</p>
      {description && <p className="max-w-sm text-xs text-text-tertiary">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          <RotateCw className="size-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
