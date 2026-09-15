import type { CountryCode, Environment } from "./common";

export type PipelineExecutionStatus =
  | "SUCCESS"
  | "FAILED"
  | "RUNNING"
  | "TIMED_OUT"
  | "PARTIAL"
  | "UNKNOWN";

export type TriggerType = "Scheduled" | "Manual" | "Event" | "Dependency";

/** The three Databricks jobs that make up the SAP pipeline ecosystem. */
export type JobId = "job1_material_master" | "job2_procurement_sales" | "job3_gold_integration";

/**
 * The four processing units a pipeline execution can belong to. Job 2 runs
 * two of these (procurement_processing, sales_processing) as parallel
 * branches — see config/sapPipelineConfig.ts for the job/notebook/table
 * mapping every other part of the app resolves this id against.
 */
export type PipelineId =
  | "material_master_processing"
  | "procurement_processing"
  | "sales_processing"
  | "gold_integration";

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
  status: PipelineExecutionStatus;
  trigger: PipelineTrigger;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  country: CountryCode;
  environment: Environment;
  owner: string | null;
  slaMinutes: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  incidentId: string | null;
}

export interface PipelineExecutionFilters {
  search?: string;
  status?: PipelineExecutionStatus[];
  country?: CountryCode[];
  pipelineId?: PipelineId[];
  triggerType?: TriggerType[];
  environment?: Environment[];
  excludeManualTriggers?: boolean;
  dateFrom?: string;
  dateTo?: string;
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
