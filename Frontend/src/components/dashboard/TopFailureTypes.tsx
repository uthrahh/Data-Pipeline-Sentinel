import type { CSSProperties } from "react";
import { Bot } from "lucide-react";

export interface FailureTypeCount {
  key: string;
  label: string;
  count: number;
  auto: boolean;
}

/** Horizontal bars ranking failure types; auto-remediated types are flagged. */
export function TopFailureTypes({ rows }: { rows: FailureTypeCount[] }) {
  const peak = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-4">
      {rows.map((r, i) => (
        <li key={r.key}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-text-secondary">
              <span className="truncate">{r.label}</span>
              {r.auto && (
                <span title="Remediated automatically" className="flex shrink-0 items-center gap-1 rounded bg-success-50 px-1.5 py-px text-[10px] font-medium text-success-700">
                  <Bot className="size-2.5" /> Auto
                </span>
              )}
            </span>
            <span className="num font-medium text-text-primary">{r.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              style={{ width: `${(r.count / peak) * 100}%`, "--i": i } as CSSProperties}
              className="animate-grow-x h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
