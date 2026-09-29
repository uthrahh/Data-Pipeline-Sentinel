import type { PipelineSummary } from "@/types";

export interface OverviewKpis {
  totalPipelines: number;
  failedPipelines: number;
  successRatePct: number;
  maxDurationMinutes: number;
  avgDurationMinutes: number;
}

const FAILED_STATUSES = new Set(["FAILED", "TIMED_OUT"]);

/**
 * Items 1-5 of the overview spec, computed directly from the 30 pipelines
 * (not a separate configurable number) — "success rate... based on
 * success pipeline" means derived from how many are actually successful,
 * not an independent input.
 */
export function computeOverviewKpis(pipelines: PipelineSummary[]): OverviewKpis {
  const total = pipelines.length;
  const failed = pipelines.filter((p) => FAILED_STATUSES.has(p.status)).length;
  const durations = pipelines.map((p) => p.durationMinutes).filter((d): d is number => d !== null);

  return {
    totalPipelines: total,
    failedPipelines: failed,
    successRatePct: total > 0 ? Math.round(((total - failed) / total) * 1000) / 10 : 0,
    maxDurationMinutes: durations.length > 0 ? Math.max(...durations) : 0,
    avgDurationMinutes: durations.length > 0 ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10 : 0,
  };
}
