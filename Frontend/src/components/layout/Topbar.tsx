"use client";

import { useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

/** A ticking UTC clock; shows a placeholder until mounted so server and client markup agree. */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden items-center gap-2.5 md:flex" role="timer" aria-label="Live clock, UTC">
      <span className="relative flex size-1.5">
        <span className="animate-ping-ring absolute inset-0 rounded-full bg-success-500" />
        <span className="relative size-1.5 rounded-full bg-success-500" />
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">Live</span>
      <span className="num w-[68px] font-mono text-xs text-text-secondary">{now ? now.toISOString().slice(11, 19) : "--:--:--"}</span>
      <span className="font-mono text-[10px] text-text-tertiary">UTC</span>
    </div>
  );
}

export function Topbar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface-subtle/70 px-4 backdrop-blur-md sm:px-8">
      <button
        onClick={() => setMobileNavOpen(true)}
        className="flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-muted lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-[18px]" />
      </button>
      <WorkspaceSwitcher />

      <button
        onClick={() => setPaletteOpen(true)}
        aria-label="Open command palette"
        className="group ml-auto flex h-9 w-9 items-center justify-center gap-2.5 rounded-lg border border-border bg-tint-1 text-xs text-text-tertiary transition-colors hover:border-border-strong hover:bg-tint-2 hover:text-text-secondary sm:w-72 sm:justify-start sm:px-2.5 md:w-80"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="hidden flex-1 text-left sm:block">Search incidents, pages…</span>
        <kbd className="hidden rounded border border-border-strong px-1.5 py-px font-mono text-[10px] sm:block">Ctrl K</kbd>
      </button>

      <LiveClock />
      <ThemeToggle />

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </header>
  );
}
