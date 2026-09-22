export interface TrendValue {
  value: number;
  deltaPct: number | null;
  direction: "up" | "down" | "flat";
  isPositive: boolean;
}

export interface DashboardMetrics {
  periodLabel: string;
  totalExecutions: TrendValue;
  failedPipelines: TrendValue;
  /** Null when the incident feed isn't available (e.g. live mode without incident data wired up yet) — not the same as zero. */
  failedRequiringAttention: number | null;
  successRatePct: TrendValue;
  maxDurationMinutes: number;
  avgDurationMinutes: TrendValue;
  incidentsWaitingApproval: number;
  activeRemediations: number;
  executionsTrend: number[];
}
