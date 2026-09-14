import { Bot, History, User as UserIcon, Cog } from "lucide-react";
import type { AuditEvent } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { cn, formatTime, formatDate } from "@/lib/utils";

const ACTOR_STYLES: Record<AuditEvent["actor"], { icon: typeof Bot; className: string }> = {
  system: { icon: Cog, className: "bg-surface-muted text-text-secondary" },
  ai: { icon: Bot, className: "bg-accent-50 text-accent-600" },
  human: { icon: UserIcon, className: "bg-info-50 text-info-600" },
};

export function AuditTimeline({ events }: { events: AuditEvent[] }) {
  const sorted = [...events].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));

  return (
    <Card>
      <CardHeader title="Audit History" icon={<History className="size-4" />} description="Full lifecycle trace for this incident" />
      <CardBody>
        <ol className="relative space-y-0">
          {sorted.map((event, i) => {
            const { icon: Icon, className } = ACTOR_STYLES[event.actor];
            const isLast = i === sorted.length - 1;
            return (
              <li key={event.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!isLast && <span className="absolute left-[13px] top-7 h-[calc(100%-20px)] w-px bg-border" />}
                <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full", className)}>
                  <Icon className="size-3.5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-sm font-medium text-text-primary">{event.label}</p>
                    <span className="text-[11px] text-text-tertiary">
                      {formatDate(event.timestamp)} · {formatTime(event.timestamp)}
                    </span>
                  </div>
                  {event.detail && <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{event.detail}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </CardBody>
    </Card>
  );
}
