import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./LoadingState";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent-500 text-white shadow-sm ring-1 ring-inset ring-white/15 hover:brightness-110",
  secondary: "border border-border-strong bg-surface-muted/50 text-text-secondary hover:bg-surface-muted hover:text-text-primary",
  danger: "bg-danger-500 text-white shadow-sm ring-1 ring-inset ring-white/15 hover:brightness-110",
  ghost: "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-[filter,background-color,color,transform] duration-150 active:scale-[0.98] focus-visible:outline-2",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {isLoading && <Spinner className="size-3.5" />}
      {children}
    </button>
  );
}
