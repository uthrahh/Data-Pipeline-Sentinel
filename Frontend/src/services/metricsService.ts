import { buildDashboardMetrics } from "@/data/mock/metrics";
import { MOCK_INCIDENTS } from "@/data/mock/incidents";
import { MOCK_PIPELINE_EXECUTIONS } from "@/data/mock/pipelines";
import { apiClient } from "@/services/apiClient";
import { USE_LIVE_API } from "@/lib/liveMode";
import type { DashboardMetrics, TrendValue } from "@/types";

const SIMULATED_LATENCY_MS = 220;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface MetricsService {
  getDashboardMetrics(): Promise<DashboardMetrics>;
}

/**
 * Mock implementation. A future `ApiMetricsService` would call
 * GET /api/dashboard/metrics and return the same DashboardMetrics shape.
 */
class MockMetricsService implements MetricsService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return delay(buildDashboardMetrics(MOCK_PIPELINE_EXECUTIONS, MOCK_INCIDENTS));
  }
}

interface PipelinesOverviewResponse {
  success: boolean;
  data: {
    window_days: number;
    total_pipeline_executions: number;
    total_pipelines_failed: number;
    pipeline_success_rate_pct: number | null;
    max_pipeline_run_duration_minutes: number | null;
    avg_pipeline_run_duration_minutes: number | null;
  };
}

function flat(value: number): TrendValue {
  // No previous-period comparison from GET /api/pipelines/overview yet, so
  // there's nothing honest to show as a delta — leave it null rather than
  // inventing a percentage the way the mock fixtures do.
  return { value, deltaPct: null, direction: "flat", isPositive: true };
}

/**
 * Live implementation — calls GET /api/pipelines/overview on the AI DevOps
 * DataOps Assistant backend, which computes these from real Databricks job
 * run history. Incident-derived fields (failedRequiringAttention,
 * incidentsWaitingApproval, activeRemediations) aren't backed by that
 * endpoint, so they're left at null/0 rather than faked — the incidents SQL
 * endpoints they'd come from need a Unity Catalog grant that isn't in place
 * yet (see /api/incidents/active).
 */
class ApiMetricsService implements MetricsService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const res = await apiClient.get<PipelinesOverviewResponse>("/api/pipelines/overview");
    const d = res.data;

    return {
      periodLabel: `Last ${d.window_days} days`,
      totalExecutions: flat(d.total_pipeline_executions),
      failedPipelines: flat(d.total_pipelines_failed),
      failedRequiringAttention: null,
      successRatePct: flat(d.pipeline_success_rate_pct ?? 0),
      maxDurationMinutes: d.max_pipeline_run_duration_minutes ?? 0,
      avgDurationMinutes: flat(d.avg_pipeline_run_duration_minutes ?? 0),
      incidentsWaitingApproval: 0,
      activeRemediations: 0,
      executionsTrend: [],
    };
  }
}

export const metricsService: MetricsService = USE_LIVE_API
  ? new ApiMetricsService()
  : new MockMetricsService();
