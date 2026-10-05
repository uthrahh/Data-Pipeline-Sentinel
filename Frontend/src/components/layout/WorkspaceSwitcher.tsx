"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Layers } from "lucide-react";
import { WORKSPACES, WORKSPACE_BY_ID } from "@/ops/catalog";
import { setWorkspace, useOps } from "@/ops/store";
import { cn } from "@/lib/utils";

export function WorkspaceSwitcher() {
  const { workspace } = useOps();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = WORKSPACE_BY_ID[workspace];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch Databricks workspace"
        className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-muted"
      >
        <Layers className="size-3.5 text-accent-500" />
        <span className="text-text-tertiary">Workspace</span>
        <span>{current.name}</span>
        <ChevronDown className={cn("size-3.5 text-text-tertiary transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div role="listbox" className="absolute left-0 top-full z-40 mt-1.5 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <p className="border-b border-border px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Databricks workspaces</p>
          {WORKSPACES.map((w) => (
            <button
              key={w.id}
              role="option"
              aria-selected={w.id === workspace}
              onClick={() => {
                setWorkspace(w.id);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-subtle"
            >
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">{w.id === workspace && <Check className="size-4 text-accent-500" />}</span>
              <span>
                <span className="block text-sm font-medium text-text-primary">{w.name}</span>
                <span className="block text-[11px] text-text-tertiary">{w.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
