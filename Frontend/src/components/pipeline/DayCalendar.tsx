"use client";

import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86400000;

interface DayCalendarProps {
  /** The selectable days (YYYY-MM-DD, oldest first). */
  days: string[];
  today: string;
  selected: string;
  onSelect: (day: string) => void;
  summary: (day: string) => { total: number; failed: number } | undefined;
}

/** A calendar of the available days. Days outside the available range are shown dimmed and cannot be selected. */
export function DayCalendar({ days, today, selected, onSelect, summary }: DayCalendarProps) {
  const first = Date.parse(`${days[0]}T00:00:00Z`);
  const last = Date.parse(`${days[days.length - 1]}T00:00:00Z`);
  const available = new Set(days);

  // Start on the Monday on or before the first day; end on the Sunday on or after the last day.
  const startOffset = (new Date(first).getUTCDay() + 6) % 7;
  const endOffset = 6 - ((new Date(last).getUTCDay() + 6) % 7);
  const cells: string[] = [];
  for (let t = first - startOffset * DAY_MS; t <= last + endOffset * DAY_MS; t += DAY_MS) cells.push(new Date(t).toISOString().slice(0, 10));

  const firstMonth = new Date(first).getUTCMonth();
  const lastMonth = new Date(last).getUTCMonth();
  const title = firstMonth === lastMonth ? `${MONTHS[firstMonth]} ${new Date(last).getUTCFullYear()}` : `${MONTHS[firstMonth]} – ${MONTHS[lastMonth]} ${new Date(last).getUTCFullYear()}`;

  return (
    <div className="rounded-xl border border-border bg-surface p-4" role="group" aria-label="Pick a day">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <p className="text-[11px] text-text-tertiary">Pick a day to see its {summary(selected)?.total ?? 0} pipeline runs</p>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((day) => {
          const inRange = available.has(day);
          const date = new Date(`${day}T00:00:00Z`);
          const stats = inRange ? summary(day) : undefined;
          const isSelected = day === selected;
          const showMonth = date.getUTCDate() === 1 || day === days[0];
          return (
            <button
              key={day}
              disabled={!inRange}
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={`${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}${day === today ? ", today" : ""}`}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-center transition-colors",
                !inRange && "cursor-default border-transparent bg-transparent text-border-strong",
                inRange && !isSelected && "border-border bg-surface text-text-secondary hover:bg-surface-muted",
                isSelected && "border-accent-500 bg-accent-50 text-accent-700",
              )}
            >
              <span className="text-sm font-semibold leading-none">
                {showMonth && inRange ? <span className="mr-1 text-[10px] font-medium opacity-70">{MONTHS[date.getUTCMonth()]}</span> : null}
                {date.getUTCDate()}
              </span>
              {inRange && (
                <span className={cn("mt-1 text-[10px] leading-none", stats && stats.failed > 0 ? "font-medium text-danger-600" : "text-text-tertiary")}>
                  {stats ? `${stats.failed} failed` : "—"}
                </span>
              )}
              {day === today && <span className="mt-1 rounded bg-accent-500 px-1 text-[8px] font-semibold uppercase leading-tight text-white">Today</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
