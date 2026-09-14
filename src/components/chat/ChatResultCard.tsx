import Link from "next/link";
import { AlertOctagon, Activity, ChevronRight, Gauge } from "lucide-react";
import type { ChatResultCard as ChatResultCardType } from "@/types";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  pipeline: Activity,
  incident: AlertOctagon,
  metric: Gauge,
};

export function ChatResultCard({ card }: { card: ChatResultCardType }) {
  const Icon = TYPE_ICON[card.type];
  return (
    <Link
      href={card.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:border-accent-500/40 hover:bg-accent-50/40",
      )}
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-muted text-text-secondary">
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold text-text-primary">{card.title}</span>
        <span className="block truncate text-[11px] text-text-tertiary">{card.subtitle}</span>
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-text-tertiary" />
    </Link>
  );
}
