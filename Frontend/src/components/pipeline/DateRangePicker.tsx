"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86400000;

export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  /** The selectable days (YYYY-MM-DD, oldest first). */
  days: string[];
  today: string;
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function short(day: string): string {
  const d = new Date(`${day}T00:00:00Z`);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function describe({ from, to }: DateRange, today: string): string {
  if (from === to) return from === today ? `Today · ${short(from)}` : short(from);
  return `${short(from)} – ${short(to)}`;
}

/** A compact date-range picker: click a start day, then an end day. Days outside the available range are disabled. */
export function DateRangePicker({ days, today, value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  // After the first click of a range the next click completes it.
  const [anchor, setAnchor] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const first = Date.parse(`${days[0]}T00:00:00Z`);
  const last = Date.parse(`${days[days.length - 1]}T00:00:00Z`);
  const available = new Set(days);

  // Start on the Monday on or before the first day; end on the Sunday on or after the last day.
  const startOffset = (new Date(first).getUTCDay() + 6) % 7;
  const endOffset = 6 - ((new Date(last).getUTCDay() + 6) % 7);
  const cells: string[] = [];
  for (let t = first - startOffset * DAY_MS; t <= last + endOffset * DAY_MS; t += DAY_MS) cells.push(new Date(t).toISOString().slice(0, 10));

  const pick = (day: string) => {
    if (anchor === null) {
      setAnchor(day);
      onChange({ from: day, to: day });
      return;
    }
    onChange(day < anchor ? { from: day, to: anchor } : { from: anchor, to: day });
    setAnchor(null);
    setOpen(false);
  };

  const preset = (count: number) => {
    onChange({ from: days[Math.max(0, days.length - count)], to: days[days.length - 1] });
    setAnchor(null);
    setOpen(false);
  };

  const presets = [
    { label: "Today", count: 1 },
    { label: "Last 7 days", count: 7 },
    { label: `Last ${days.length} days`, count: days.length },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface-muted"
      >
        <CalendarDays className="size-3.5 text-text-tertiary" />
        {describe(value, today)}
        <ChevronDown className={cn("size-3.5 text-text-tertiary transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div role="dialog" aria-label="Choose a date range" className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => preset(p.count)}
                className="rounded-md border border-border-strong px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-text-tertiary">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="py-1">
                {w}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day) => {
              const inRange = available.has(day);
              const date = new Date(`${day}T00:00:00Z`);
              const isEdge = day === value.from || day === value.to;
              const isBetween = day > value.from && day < value.to;
              return (
                <button
                  key={day}
                  disabled={!inRange}
                  onClick={() => pick(day)}
                  aria-pressed={isEdge}
                  aria-label={`${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}${day === today ? ", today" : ""}`}
                  className={cn(
                    "flex h-8 items-center justify-center text-xs transition-colors",
                    !inRange && "cursor-default text-border-strong",
                    inRange && !isEdge && !isBetween && "rounded-md text-text-secondary hover:bg-surface-muted",
                    isBetween && "bg-accent-50 text-accent-700",
                    isEdge && "rounded-md bg-accent-500 font-semibold text-white",
                    inRange && day === today && !isEdge && "font-semibold text-accent-700",
                  )}
                >
                  {date.getUTCDate()}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-text-tertiary">{anchor ? "Now pick the end day." : "Pick a start day, then an end day."}</p>
        </div>
      )}
    </div>
  );
}
