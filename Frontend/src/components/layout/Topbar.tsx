"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

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
        <WorkspaceSwitcher />
      </div>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </header>
  );
}
