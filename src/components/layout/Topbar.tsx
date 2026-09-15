"use client";

import { useState } from "react";
import { ChevronDown, Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileNav } from "./MobileNav";

export function Topbar() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-muted lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-4.5" />
        </button>
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface-subtle px-3 py-1.5 text-xs text-text-tertiary sm:flex">
          <Search className="size-3.5" />
          <span>Search pipelines, incidents, run IDs…</span>
          <kbd className="ml-6 rounded border border-border-strong bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-surface-muted"
          >
            <div className="flex size-7 items-center justify-center rounded-full bg-navy-800 text-[11px] font-semibold text-white">
              JD
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-xs font-medium text-text-primary">J. Datta</p>
              <p className="text-[10px] text-text-tertiary">Data Engineer</p>
            </div>
            <ChevronDown className="size-3.5 text-text-tertiary" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div
                className={cn(
                  "absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg animate-scale-in",
                )}
              >
                <div className="border-b border-border px-3.5 py-3">
                  <p className="text-xs font-medium text-text-primary">J. Datta</p>
                  <p className="text-[11px] text-text-tertiary">j.datta@sentinel.ai</p>
                </div>
                <button className="w-full px-3.5 py-2.5 text-left text-xs text-text-secondary hover:bg-surface-muted">
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}
