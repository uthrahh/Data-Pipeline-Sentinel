import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number | null): string {
  if (minutes === null || Number.isNaN(minutes)) return "—";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rem = Math.round(minutes % 60);
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// All timestamps in the mock data are UTC, and the dashboard explicitly labels
// itself as UTC (see PageHeader copy) — so formatting is pinned to UTC rather
// than the viewer's local timezone, keeping displayed times consistent for
// every user regardless of where they are.
//
// The hour/minute part is built manually rather than via
// toLocaleString(..., { hour12: false }): that combination is genuinely
// inconsistent across ICU implementations for the midnight hour — some
// render "00:xx", others "24:xx" — which caused a real SSR/client hydration
// mismatch here (found via a real ai_dataops_poc.sap_demo timestamp that
// happens to land exactly at 00:xx UTC). getUTCHours()/getUTCMinutes() have
// no such ambiguity.
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}, ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

export function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
