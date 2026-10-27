"use client";

import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { SidebarNav } from "./SidebarNav";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: SSR-safe portal mount detection
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-navy-950 animate-slide-up">
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <BrandMark />
            <p className="text-[15px] font-semibold tracking-[-0.02em]">Sentinel</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-text-tertiary hover:bg-tint-2 hover:text-text-primary" aria-label="Close navigation">
            <X className="size-4" />
          </button>
        </div>
        <SidebarNav onNavigate={onClose} />
      </div>
    </div>,
    document.body,
  );
}
