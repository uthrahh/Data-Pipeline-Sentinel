import { MOCK_PIPELINE_EXECUTIONS } from "@/data/mock/pipelines";
import { apiClient } from "@/services/apiClient";
import { USE_LIVE_API } from "@/lib/liveMode";
import type {
  Paginated,
  PipelineExecution,
  PipelineExecutionQuery,
  PipelineExecutionStatus,
  TriggerType,
} from "@/types";

const SIMULATED_LATENCY_MS = 260;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export interface PipelineService {
  getExecutions(query?: PipelineExecutionQuery): Promise<Paginated<PipelineExecution>>;
  getExecution(runId: string): Promise<PipelineExecution | null>;
}

/** Shared by both the mock and live implementations so filtering/sorting/pagination behave identically regardless of data source. */
function filterSortPaginate(
  data: PipelineExecution[],
  query: PipelineExecutionQuery = {},
): Paginated<PipelineExecution> {
  const { filters, sortKey = "startTime", sortDirection = "desc", page = 1, pageSize = 10 } = query;

  let items = [...data];

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
  if (filters?.pipelineId && filters.pipelineId.length > 0) {
    items = items.filter((e) => filters.pipelineId!.includes(e.pipelineId));
  }
  if (filters?.country && filters.country.length > 0) {
    items = items.filter((e) => e.country !== undefined && filters.country!.includes(e.country));
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

  return { items: paged, total, page, pageSize };
}

/**
 * Mock implementation — filters/sorts/paginates the in-memory fixture set.
 */
class MockPipelineService implements PipelineService {
  private data = MOCK_PIPELINE_EXECUTIONS;

  async getExecutions(query: PipelineExecutionQuery = {}): Promise<Paginated<PipelineExecution>> {
    return delay(filterSortPaginate(this.data, query));
  }

  async getExecution(runId: string): Promise<PipelineExecution | null> {
    return delay(this.data.find((e) => e.runId === runId) ?? null);
  }
}

/** Raw shapes returned by the AI DevOps DataOps Assistant FastAPI backend's
 * Jobs-API-backed endpoints (GET /api/pipelines, GET /api/pipelines/{job_id}/runs).
 * These read live from Databricks Jobs, unlike /api/pipeline-operations (a
 * separate, SQL/Delta-table-backed endpoint this app doesn't use). */
interface RawJob {
  job_id: number;
  name: string | null;
  created_time: string | null;
  creator_user_name: string | null;
  status: string | null;
}

interface RawRun {
  run_id: number;
  job_id: number;
  run_name: string | null;
  lifecycle_state: string | null;
  result_state: string | null;
  state_message: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  trigger: string | null;
  run_page_url: string | null;
}

interface PipelinesListResponse {
  success: boolean;
  data: { pipelines: RawJob[]; count: number };
}

interface PipelineRunsResponse {
  success: boolean;
  data: { runs: RawRun[]; count: number };
}

function normalizeStatus(resultState: string | null, lifecycleState: string | null): PipelineExecutionStatus {
  const s = (resultState ?? lifecycleState ?? "").toUpperCase();
  if (!s) return "UNKNOWN";
  if (s === "SUCCESS") return "SUCCESS";
  if (s === "SUCCESS_WITH_FAILURES") return "PARTIAL";
  if (s === "FAILED" || s === "ERROR" || s === "INTERNAL_ERROR" || s === "UPSTREAM_FAILED") return "FAILED";
  if (s === "TIMEDOUT" || s === "TIMEOUT" || s === "TIMED_OUT") return "TIMED_OUT";
  if (s === "RUNNING" || s === "PENDING" || s === "QUEUED" || s === "BLOCKED" || s === "WAITING_FOR_RETRY") return "RUNNING";
  if (s === "CANCELED" || s === "CANCELLED" || s === "SKIPPED") return "PARTIAL";
  return "UNKNOWN";
}

function normalizeTriggerType(raw: string | null): TriggerType {
  if (!raw) return "Scheduled";
  const s = raw.toUpperCase();
  if (s.includes("MANUAL") || s.includes("ONE_TIME") || s === "RETRY") return "Manual";
  if (s.includes("FILE") || s.includes("EVENT")) return "Event";
  if (s.includes("RUN_JOB") || s.includes("DEPEND")) return "Dependency";
  return "Scheduled";
}

function mapRun(run: RawRun, jobName: string | null): PipelineExecution {
  return {
    runId: String(run.run_id),
    pipelineId: String(run.job_id),
    pipelineName: run.run_name ?? jobName ?? `Job ${run.job_id}`,
    // Real job name (e.g. "Material Master Processing") when known, so the
    // Job column shows something readable instead of a raw numeric id —
    // sapPipelineConfig's job labels don't match live Databricks job ids.
    jobId: jobName ?? String(run.job_id),
    status: normalizeStatus(run.result_state, run.lifecycle_state),
    trigger: {
      type: normalizeTriggerType(run.trigger),
      name: run.trigger ?? "Unknown",
    },
    startTime: run.start_time ?? "",
    endTime: run.end_time,
    durationMinutes: run.duration_minutes,
    owner: null,
    slaMinutes: null,
    errorCode: null,
    errorMessage: run.state_message,
    incidentId: null, // Not available via the Jobs API — comes from the (currently permission-blocked) incidents SQL endpoints.
  };
}

/**
 * Live implementation — calls the AI DevOps DataOps Assistant FastAPI backend's
 * Jobs-API-backed endpoints. GET /api/pipelines lists jobs; there's no single
 * "all runs across all jobs" endpoint, so this fetches recent runs per job
 * (GET /api/pipelines/{job_id}/runs) and merges them into one execution list.
 * Filtering/sorting/pagination happen client-side, same as the mock service.
 */
class ApiPipelineService implements PipelineService {
  private async fetchAll(): Promise<PipelineExecution[]> {
    const jobsRes = await apiClient.get<PipelinesListResponse>("/api/pipelines");
    const jobs = jobsRes.data.pipelines;

    const runsByJob = await Promise.all(
      jobs.map(async (job) => {
        try {
          // Databricks Jobs API caps list_runs at 26 per call; the backend clamps too, but stay in bounds here as well.
          const res = await apiClient.get<PipelineRunsResponse>(`/api/pipelines/${job.job_id}/runs?limit=25`);
          return res.data.runs.map((run) => mapRun(run, job.name));
        } catch {
          return []; // One job's runs failing shouldn't blank out the whole page.
        }
      }),
    );

    return runsByJob.flat();
  }

  async getExecutions(query: PipelineExecutionQuery = {}): Promise<Paginated<PipelineExecution>> {
    const all = await this.fetchAll();
    return filterSortPaginate(all, query);
  }

  async getExecution(runId: string): Promise<PipelineExecution | null> {
    const all = await this.fetchAll();
    return all.find((e) => e.runId === runId) ?? null;
  }
}

export const pipelineService: PipelineService = USE_LIVE_API
  ? new ApiPipelineService()
  : new MockPipelineService();
