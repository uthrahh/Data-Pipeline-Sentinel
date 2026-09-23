"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { MobileNav } from "./MobileNav";

export function Topbar() {
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
          <span>Search pipelines, incidents, execution IDs…</span>
          <kbd className="ml-6 rounded border border-border-strong bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
            ⌘K
          </kbd>
        </div>
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}
