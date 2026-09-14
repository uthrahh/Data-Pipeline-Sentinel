"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  Gauge,
  LayoutGrid,
  LineChart,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/pipelines", label: "Pipelines", icon: Activity },
  { href: "/incidents", label: "Incidents", icon: AlertOctagon },
  { href: "/remediation", label: "Remediation", icon: Wrench },
  { href: "/analytics", label: "Analytics", icon: LineChart },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden w-60 shrink-0 flex-col bg-navy-950 text-text-inverse lg:flex",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-accent-500">
          <Gauge className="size-4 text-white" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">Sentinel</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">AI DataOps</p>
        </div>
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
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white/85",
              )}
            >
              <Icon
                className={cn("size-[17px] shrink-0", active ? "text-accent-400" : "text-white/40 group-hover:text-white/70")}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="rounded-lg bg-white/5 px-3 py-2.5">
          <p className="text-[11px] font-medium text-white/50">Environment</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-white/90">
            <span className="size-1.5 rounded-full bg-success-500" />
            Production · Unity Catalog
          </p>
        </div>
      </div>
    </aside>
  );
}
