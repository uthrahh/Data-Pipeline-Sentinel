import type { CSSProperties, ReactNode } from "react";
import { Sparkline } from "@/components/common/Sparkline";

export type Tone = "accent" | "success" | "danger" | "warning" | "neutral";

const TONE_COLOR: Record<Tone, string> = {
  accent: "var(--color-accent-400)",
  success: "var(--color-success-600)",
  danger: "var(--color-danger-600)",
  warning: "var(--color-warning-600)",
  neutral: "var(--color-neutral-600)",
};

/** A ring gauge, 0-100, drawn clockwise from 12 o'clock. */
function Ring({ percent, color }: { percent: number; color: string }) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <svg viewBox="0 0 44 44" className="size-12 shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="22" cy="22" r="17" fill="none" stroke="var(--color-border-strong)" strokeWidth="3.5" opacity="0.7" />
      <circle
        cx="22"
        cy="22"
        r="17"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength={100}
        className="animate-ring-fill"
        style={{ "--off": 100 - p, filter: `drop-shadow(0 0 4px ${color})` } as CSSProperties}
      />
    </svg>
  );
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  supporting?: string;
  tone?: Tone;
  trend?: number[];
  ring?: number;
  /** A two-part proportion bar, e.g. succeeded vs failed. */
  split?: { good: number; bad: number };
  index?: number;
}

export function StatTile({ label, value, supporting, tone = "neutral", trend, ring, split, index = 0 }: StatTileProps) {
  const color = TONE_COLOR[tone];
  return (
    <div data-spotlight style={{ "--i": index } as CSSProperties} className="animate-rise flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-text-secondary">{label}</p>
        <span className="mt-1 size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="whitespace-nowrap text-[32px] font-semibold leading-none tracking-[-0.045em] text-text-primary">{value}</p>
          {supporting && <p className="mt-2.5 text-xs leading-snug text-text-tertiary">{supporting}</p>}
        </div>
        {ring !== undefined && <Ring percent={ring} color={color} />}
      </div>
      {split && split.good + split.bad > 0 && (
        <div className="mt-4 flex h-8 flex-col justify-end" aria-hidden="true">
          <div className="flex h-1.5 gap-[2px] overflow-hidden rounded-full">
            <div className="animate-grow-x rounded-l-full bg-success-500/60" style={{ width: `${(split.good / (split.good + split.bad)) * 100}%` }} />
            <div className="animate-grow-x rounded-r-full bg-danger-500" style={{ width: `${(split.bad / (split.good + split.bad)) * 100}%`, "--i": 1 } as CSSProperties} />
          </div>
        </div>
      )}
      {trend && <Sparkline data={trend} color={color} className="mt-4 h-8 w-full" />}
    </div>
  );
}
