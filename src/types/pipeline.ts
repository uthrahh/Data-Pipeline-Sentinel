import type { Environment, Region } from "./common";

export type PipelineExecutionStatus =
  | "SUCCESS"
  | "FAILED"
  | "RUNNING"
  | "TIMED_OUT"
  | "PARTIAL"
  | "UNKNOWN";

export type TriggerType = "Scheduled" | "Manual" | "Event" | "Dependency";

export type ExecutionType =
  | "DatabricksNotebook"
  | "DatabricksJob"
  | "DataFactoryPipeline"
  | "LogicApp"
  | "SqlWarehouse";

export interface PipelineTrigger {
  type: TriggerType;
  name: string;
}

/**
 * A single execution (run) of a pipeline. Rows in the "All Pipeline Executions"
 * table and the subject of the pipeline detail page are PipelineExecution records.
 */
export interface PipelineExecution {
  runId: string;
  pipelineId: string;
  pipelineName: string;
  status: PipelineExecutionStatus;
  trigger: PipelineTrigger;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  region: Region;
  country: string | null;
  environment: Environment;
  executionType: ExecutionType;
  activityName: string;
  owner: string | null;
  slaMinutes: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  incidentId: string | null;
}

export interface PipelineExecutionFilters {
  search?: string;
  status?: PipelineExecutionStatus[];
  region?: Region[];
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
