import type { LiveDashboard } from "@/types";

export interface LiveOverviewKpis {
  totalPipelines: number;
  failedPipelines: number;
  successRatePct: number;
  maxDurationMinutes: number;
  totalRuns: number;
  activeIncidents: number;
  historyIncidents: number;
}

function isFailedStatus(status: string): boolean {
  const s = status.toUpperCase();
  return s === "FAILED" || s.includes("ERROR") || s === "ACTION_REQUIRED" || s === "REMEDIATION_FAILED";
}

function isSuccessStatus(status: string): boolean {
  return status.toUpperCase() === "SUCCESS";
}

/** Computed entirely from real /api/dashboard data — pipeline_operations only covers the trailing 24h (that's the reference API's own query window, not a choice made here). */
export function computeLiveOverviewKpis(data: LiveDashboard): LiveOverviewKpis {
  const ops = data.pipeline_operations.items;
  const distinctPipelines = new Set(ops.map((o) => o.pipeline));
  const failed = ops.filter((o) => isFailedStatus(o.overall_status));
  const succeeded = ops.filter((o) => isSuccessStatus(o.overall_status));

  const durations = ops
    .map((o) => {
      if (!o.start_time || !o.end_time) return null;
      const ms = new Date(o.end_time).getTime() - new Date(o.start_time).getTime();
      return ms > 0 ? ms / 60000 : null;
    })
    .filter((d): d is number => d !== null);

  return {
    totalPipelines: distinctPipelines.size,
    failedPipelines: new Set(failed.map((o) => o.pipeline)).size,
    successRatePct: ops.length > 0 ? Math.round((succeeded.length / ops.length) * 1000) / 10 : 0,
    maxDurationMinutes: durations.length > 0 ? Math.round(Math.max(...durations) * 10) / 10 : 0,
    totalRuns: ops.length,
    activeIncidents: data.active_incidents.count,
    historyIncidents: data.incident_history.count,
  };
}
