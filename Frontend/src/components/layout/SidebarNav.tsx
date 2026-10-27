"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { inWorkspace } from "@/ops/catalog";
import { isActive } from "@/ops/derive";
import { useOps } from "@/ops/store";
import { NAV_ITEMS } from "./nav";

/** The navigation list shared by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { incidents, workspace } = useOps();
  const open = useMemo(() => incidents.filter((i) => isActive(i) && inWorkspace(i.pipelineId, workspace)).length, [incidents, workspace]);

  return (
    <nav aria-label="Primary" className="flex-1 px-3 py-5">
      <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.14em] text-text-tertiary">Operate</p>
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                  active ? "bg-tint-3 text-text-primary ring-1 ring-inset ring-border-strong" : "text-text-secondary hover:bg-tint-2 hover:text-text-primary",
                )}
              >
                {active && <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-accent-400 shadow-[0_0_12px_2px_rgb(240_104_108/0.55)]" />}
                <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-accent-400" : "text-text-tertiary group-hover:text-text-secondary")} strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/incidents" && open > 0 && (
                  <span className="num rounded-md bg-accent-500/15 px-1.5 py-px text-[10px] font-semibold text-accent-600 ring-1 ring-inset ring-accent-500/25">{open}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
