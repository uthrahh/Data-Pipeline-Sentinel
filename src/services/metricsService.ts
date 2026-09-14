import { buildDashboardMetrics } from "@/data/mock/metrics";
import { MOCK_INCIDENTS } from "@/data/mock/incidents";
import { MOCK_PIPELINE_EXECUTIONS } from "@/data/mock/pipelines";
import type { DashboardMetrics } from "@/types";

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

export const metricsService: MetricsService = new MockMetricsService();
