import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-16 text-text-tertiary", className)}>
      <Spinner className="size-5" />
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-surface-muted", className)} />;
}

export function KpiCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <SkeletonLine className="h-3 w-28" />
      <SkeletonLine className="mt-4 h-8 w-20" />
      <SkeletonLine className="mt-3 h-3 w-32" />
    </div>
  );
}

export function TableRowsSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border last:border-0">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3.5">
              <SkeletonLine className="h-3.5 w-full max-w-[140px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
