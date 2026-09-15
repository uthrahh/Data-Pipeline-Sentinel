import type { DashboardMetrics, Incident, PipelineExecution, TrendValue } from "@/types";

function trend(value: number, deltaPct: number | null): TrendValue {
  const direction: TrendValue["direction"] = !deltaPct ? "flat" : deltaPct > 0 ? "up" : "down";
  return { value, deltaPct, direction, isPositive: deltaPct !== null && deltaPct >= 0 };
}

/**
 * Derives dashboard KPIs from the same execution/incident fixtures the tables
 * render, so the summary cards can never drift out of sync with the detail views.
 * A future ApiMetricsService would instead call GET /api/dashboard/metrics directly.
 */
export function buildDashboardMetrics(
  executions: PipelineExecution[],
  incidents: Incident[],
  referenceDate: string = "2026-09-15",
): DashboardMetrics {
  const today = executions.filter((e) => e.startTime.startsWith(referenceDate));
  const failed = today.filter((e) => e.status === "FAILED" || e.status === "TIMED_OUT");
  const succeeded = today.filter((e) => e.status === "SUCCESS");
  const completed = today.filter((e) => e.durationMinutes !== null);
  const durations = completed.map((e) => e.durationMinutes as number);

  const successRate = today.length > 0 ? (succeeded.length / today.length) * 100 : 0;
  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

  const attentionIncidents = incidents.filter((i) =>
    ["OPEN", "INVESTIGATING", "WAITING_APPROVAL", "REMEDIATION_FAILED", "VALIDATION_FAILED"].includes(i.status),
  );

  const waitingApproval = incidents.filter((i) => i.status === "WAITING_APPROVAL").length;
  const activeRemediations = incidents.filter((i) => i.status === "REMEDIATING").length;

  return {
    periodLabel: "Today",
    totalExecutions: trend(today.length, 8.4),
    failedPipelines: trend(failed.length, -12.5),
    failedRequiringAttention: attentionIncidents.length,
    successRatePct: trend(Math.round(successRate * 10) / 10, 1.2),
    maxDurationMinutes: maxDuration,
    avgDurationMinutes: trend(Math.round(avgDuration * 10) / 10, -3.1),
    incidentsWaitingApproval: waitingApproval,
    activeRemediations,
    executionsTrend: [58, 61, 55, 64, 70, 66, today.length],
  };
}
