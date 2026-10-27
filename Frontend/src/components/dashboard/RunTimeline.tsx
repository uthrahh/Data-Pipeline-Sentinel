import Link from "next/link";
import type { CSSProperties } from "react";
import { formatTime } from "@/lib/utils";
import type { PipelineRun } from "@/ops/types";

/** Every run of the day as one cell, oldest to newest. Failed runs link to their incident. */
export function RunTimeline({ runs }: { runs: PipelineRun[] }) {
  if (runs.length === 0) return <p className="py-6 text-center text-xs text-text-tertiary">No runs yet today.</p>;
  const first = runs[0];
  const last = runs[runs.length - 1];

  return (
    <div>
      <ul className="flex h-12 items-stretch gap-[3px]" aria-label="Today's pipeline runs, oldest to newest">
        {runs.map((r, i) => {
          const failed = r.executionStatus !== "SUCCESS";
          const label = `${r.pipeline} · ${formatTime(r.startTime)} · ${failed ? "Failed" : "Success"}`;
          const cell = (
            <span
              title={label}
              aria-label={label}
              style={{ "--i": i } as CSSProperties}
              className={
                failed
                  ? "animate-grow-y block h-full w-full rounded-[3px] bg-danger-500 shadow-[0_0_10px_-2px_var(--color-danger-500)] transition-[filter] hover:brightness-125"
                  : "animate-grow-y block h-full w-full rounded-[3px] bg-success-500/30 transition-colors hover:bg-success-500/70"
              }
            />
          );
          return (
            <li key={r.runId} className="min-w-0 flex-1">
              {failed && r.incidentId ? (
                <Link href={`/incidents/${r.incidentId}`} className="block h-full">
                  {cell}
                </Link>
              ) : (
                cell
              )}
            </li>
          );
        })}
      </ul>
      <div className="num mt-2 flex justify-between font-mono text-[10px] text-text-tertiary">
        <span>{formatTime(first.startTime)}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-sm bg-success-500/50" /> Success
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-sm bg-danger-500" /> Failed
          </span>
        </span>
        <span>{formatTime(last.startTime)}</span>
      </div>
    </div>
  );
}
