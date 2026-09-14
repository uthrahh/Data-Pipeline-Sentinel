"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Activity, AlertOctagon, Gauge, LayoutGrid, LineChart, Wrench, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/pipelines", label: "Pipelines", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: AlertOctagon },
  { href: "/remediation", label: "Remediation", icon: Wrench },
  { href: "/analytics", label: "Analytics", icon: LineChart },
];

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
      <div className="absolute inset-0 bg-navy-950/50 animate-fade-in" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-navy-950 text-text-inverse animate-slide-up">
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-accent-500">
              <Gauge className="size-4 text-white" strokeWidth={2.25} />
            </div>
            <p className="text-sm font-semibold">Sentinel</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-white/60 hover:bg-white/10" aria-label="Close navigation">
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5",
                )}
              >
                <Icon className={cn("size-[17px]", active ? "text-accent-400" : "text-white/40")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>,
    document.body,
  );
}
