import { MOCK_PIPELINE_EXECUTIONS } from "@/data/mock/pipelines";
import type { Paginated, PipelineExecution, PipelineExecutionQuery } from "@/types";

const SIMULATED_LATENCY_MS = 260;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface PipelineService {
  getExecutions(query?: PipelineExecutionQuery): Promise<Paginated<PipelineExecution>>;
  getExecution(runId: string): Promise<PipelineExecution | null>;
}

/**
 * Mock implementation — filters/sorts/paginates the in-memory fixture set.
 * A future `ApiPipelineService` would call:
 *   GET /api/pipelines            (query params mirror PipelineExecutionQuery)
 *   GET /api/pipelines/{runId}
 * and return the exact same shapes, so no caller needs to change.
 */
class MockPipelineService implements PipelineService {
  private data = MOCK_PIPELINE_EXECUTIONS;

  async getExecutions(query: PipelineExecutionQuery = {}): Promise<Paginated<PipelineExecution>> {
    const { filters, sortKey = "startTime", sortDirection = "desc", page = 1, pageSize = 10 } = query;

    let items = [...this.data];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.pipelineName.toLowerCase().includes(q) ||
          e.trigger.name.toLowerCase().includes(q) ||
          e.runId.toLowerCase().includes(q),
      );
    }
    if (filters?.status && filters.status.length > 0) {
      items = items.filter((e) => filters.status!.includes(e.status));
    }
    if (filters?.country && filters.country.length > 0) {
      items = items.filter((e) => filters.country!.includes(e.country));
    }
    if (filters?.pipelineId && filters.pipelineId.length > 0) {
      items = items.filter((e) => filters.pipelineId!.includes(e.pipelineId));
    }
    if (filters?.environment && filters.environment.length > 0) {
      items = items.filter((e) => filters.environment!.includes(e.environment));
    }
    if (filters?.triggerType && filters.triggerType.length > 0) {
      items = items.filter((e) => filters.triggerType!.includes(e.trigger.type));
    }
    if (filters?.excludeManualTriggers) {
      items = items.filter((e) => e.trigger.type !== "Manual");
    }
    if (filters?.dateFrom) {
      items = items.filter((e) => e.startTime >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      items = items.filter((e) => e.startTime <= filters.dateTo!);
    }

    items.sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return delay({ items: paged, total, page, pageSize });
  }

  async getExecution(runId: string): Promise<PipelineExecution | null> {
    return delay(this.data.find((e) => e.runId === runId) ?? null);
  }
}

export const pipelineService: PipelineService = new MockPipelineService();
