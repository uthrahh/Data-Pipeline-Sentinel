"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface FilterMenuProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  icon?: React.ReactNode;
}

export function FilterMenu({ label, options, selected, onChange, icon }: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
          selected.length > 0
            ? "border-accent-500/40 bg-accent-50 text-accent-700"
            : "border-border-strong bg-surface text-text-secondary hover:bg-surface-muted",
        )}
      >
        {icon}
        {label}
        {selected.length > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-semibold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown className="size-3.5" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-1.5 w-52 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg animate-scale-in">
          {options.length === 0 && <p className="px-3 py-2 text-xs text-text-tertiary">No options</p>}
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggleValue(opt.value)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-muted"
              >
                <span
                  className={cn(
                    "flex size-3.5 items-center justify-center rounded border",
                    checked ? "border-accent-500 bg-accent-500" : "border-border-strong",
                  )}
                >
                  {checked && (
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.3 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                {opt.label}
              </button>
            );
          })}
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="mt-1 w-full border-t border-border px-3 py-2 text-left text-xs font-medium text-text-tertiary hover:bg-surface-muted"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
