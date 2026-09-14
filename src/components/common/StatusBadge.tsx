import type { StatusStyle } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  style: StatusStyle;
  className?: string;
  size?: "sm" | "md";
  pulse?: boolean;
}

export function StatusBadge({ style, className, size = "sm", pulse = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        style.badgeClass,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", style.dot, pulse && "animate-pulse-dot")} />
      {style.label}
    </span>
  );
}
