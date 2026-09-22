import type { CountryCode, Environment } from "./common";

export type PipelineExecutionStatus =
  | "SUCCESS"
  | "FAILED"
  | "RUNNING"
  | "TIMED_OUT"
  | "PARTIAL"
  | "UNKNOWN";

export type TriggerType = "Scheduled" | "Manual" | "Event" | "Dependency";

/**
 * A Databricks job identifier. Left as a plain string (rather than a fixed
 * union) because live executions come from whatever jobs actually exist in
 * the connected Databricks workspace — sapPipelineConfig.ts's JOBS list is
 * opportunistic enrichment (known ids get a friendly label), not a closed set.
 */
export type JobId = string;

/**
 * A pipeline/processing-unit identifier. Same reasoning as JobId: mock data
 * uses the curated SAP ids from sapPipelineConfig.ts, live data uses whatever
 * pipeline name Databricks reports — both are valid strings.
 */
export type PipelineId = string;

export interface PipelineTrigger {
  type: TriggerType;
  name: string;
}

/**
 * A single execution (run) of a pipeline. Rows in the "Pipeline Executions"
 * table and the subject of the pipeline detail page are PipelineExecution
 * records. Job, notebook, and source/target tables are intentionally NOT
 * stored here — they're resolved from `pipelineId` via sapPipelineConfig so
 * that config is the single source of truth for the SAP architecture.
 */
export interface PipelineExecution {
  runId: string;
  pipelineId: PipelineId;
  pipelineName: string;
  /** Raw Databricks job id, used as a fallback label when pipelineId doesn't
   * match a known entry in sapPipelineConfig.ts (e.g. live, unmapped data). */
  jobId?: string | null;
  status: PipelineExecutionStatus;
  trigger: PipelineTrigger;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  /** Not sourced from the live Databricks backend — present only on mock
   * data, and only rendered on pages that haven't been wired to live data. */
  country?: CountryCode;
  environment?: Environment;
  owner: string | null;
  slaMinutes: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  incidentId: string | null;
}

export interface PipelineExecutionFilters {
  search?: string;
  status?: PipelineExecutionStatus[];
  pipelineId?: PipelineId[];
  triggerType?: TriggerType[];
  excludeManualTriggers?: boolean;
  dateFrom?: string;
  dateTo?: string;
  /** Only meaningful against mock data — live executions don't carry a country. */
  country?: CountryCode[];
}

export type PipelineExecutionSortKey =
  | "startTime"
  | "endTime"
  | "durationMinutes"
  | "pipelineName"
  | "status";

export interface PipelineExecutionQuery {
  filters?: PipelineExecutionFilters;
  sortKey?: PipelineExecutionSortKey;
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
