"use client";

import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { setTheme, useTheme, type ThemeChoice } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const THEME_OPTIONS: { value: ThemeChoice; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** A three-way appearance switch: light, dark, or follow the system. */
export function ThemeToggle() {
  const theme = useTheme();
  return (
    <div role="radiogroup" aria-label="Appearance" className="flex h-9 items-center rounded-lg border border-border bg-tint-1 p-0.5">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              "flex size-7 items-center justify-center rounded-md transition-colors duration-150",
              active ? "bg-surface-muted text-text-primary shadow-sm ring-1 ring-inset ring-border-strong" : "text-text-tertiary hover:text-text-primary",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
