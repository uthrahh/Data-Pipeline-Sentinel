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
  failedRequiringAttention: number;
  successRatePct: TrendValue;
  maxDurationMinutes: number;
  avgDurationMinutes: TrendValue;
  incidentsWaitingApproval: number;
  activeRemediations: number;
  executionsTrend: number[];
}
