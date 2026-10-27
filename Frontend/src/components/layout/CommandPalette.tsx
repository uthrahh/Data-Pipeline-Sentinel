"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertOctagon, CornerDownLeft, Layers, Search, type LucideIcon } from "lucide-react";
import { WORKSPACES, inWorkspace } from "@/ops/catalog";
import { FAILURE_BY_KEY } from "@/ops/failureTypes";
import { isActive } from "@/ops/derive";
import { setWorkspace, useOps } from "@/ops/store";
import { setTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav";
import { THEME_OPTIONS } from "./ThemeToggle";

interface Command {
  id: string;
  group: "Go to" | "Incidents" | "Workspace" | "Appearance";
  title: string;
  sub?: string;
  icon: LucideIcon;
  keywords: string;
  run: () => void;
}

const MAX_INCIDENTS = 6;

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { incidents, workspace } = useOps();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const go = (href: string) => () => router.push(href);
    const q = query.trim().toLowerCase();
    const pages: Command[] = NAV_ITEMS.map((n) => ({ id: n.href, group: "Go to", title: n.label, sub: n.hint, icon: n.icon, keywords: n.label.toLowerCase(), run: go(n.href) }));
    const spaces: Command[] = WORKSPACES.map((w) => ({
      id: `ws-${w.id}`,
      group: "Workspace",
      title: `Switch to ${w.name}`,
      sub: w.description,
      icon: Layers,
      keywords: `workspace ${w.name.toLowerCase()}`,
      run: () => setWorkspace(w.id),
    }));
    const themes: Command[] = THEME_OPTIONS.map((t) => ({
      id: `theme-${t.value}`,
      group: "Appearance",
      title: `Use ${t.label.toLowerCase()} theme`,
      sub: t.value === "system" ? "Follow the operating system" : undefined,
      icon: t.icon,
      keywords: `theme appearance mode ${t.label.toLowerCase()}`,
      run: () => setTheme(t.value),
    }));
    const scoped = incidents.filter((i) => inWorkspace(i.pipelineId, workspace));
    // With no query, suggest the open incidents; with one, search all of them.
    const pool = q ? scoped : scoped.filter(isActive);
    const found: Command[] = pool
      .map((i) => ({
        id: i.id,
        group: "Incidents" as const,
        title: i.pipeline,
        sub: `${i.id} · ${FAILURE_BY_KEY[i.failureKey].label}`,
        icon: AlertOctagon,
        keywords: `${i.id} ${i.pipeline} ${FAILURE_BY_KEY[i.failureKey].label}`.toLowerCase(),
        run: go(`/incidents/${i.id}`),
      }))
      .filter((c) => !q || c.keywords.includes(q))
      .slice(0, MAX_INCIDENTS);
    return [...pages, ...found, ...spaces, ...themes].filter((c) => !q || c.group === "Incidents" || c.keywords.includes(q));
  }, [query, incidents, workspace, router]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open || typeof document === "undefined") return null;

  const close = () => {
    setQuery("");
    setCursor(0);
    onClose();
  };
  const choose = (c: Command | undefined) => {
    if (!c) return;
    c.run();
    close();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[cursor]);
    } else if (e.key === "Escape") {
      close();
    }
  };

  let lastGroup = "";
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm animate-fade-in" onMouseDown={close} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-lg animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-4 text-text-tertiary" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Search incidents, jump to a page, switch workspace…"
            aria-label="Search commands"
            className="h-12 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <kbd className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">esc</kbd>
        </div>
        <ul ref={listRef} role="listbox" className="max-h-[360px] overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-10 text-center text-sm text-text-tertiary">No matches for “{query}”.</li>}
          {results.map((c, idx) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            const Icon = c.icon;
            return (
              <li key={c.id} role="presentation">
                {header && <p className="px-3 pb-1 pt-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">{header}</p>}
                <button
                  role="option"
                  aria-selected={idx === cursor}
                  data-index={idx}
                  onMouseMove={() => setCursor(idx)}
                  onClick={() => choose(c)}
                  className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors", idx === cursor && "bg-tint-3")}
                >
                  <Icon className={cn("size-4 shrink-0", idx === cursor ? "text-accent-400" : "text-text-tertiary")} strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-text-primary">{c.title}</span>
                    {c.sub && <span className="block truncate text-[11px] text-text-tertiary">{c.sub}</span>}
                  </span>
                  {idx === cursor && <CornerDownLeft className="size-3.5 text-text-tertiary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
