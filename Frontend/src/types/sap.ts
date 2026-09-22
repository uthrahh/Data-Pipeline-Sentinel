import type { CountryCode } from "./common";
import type { JobId, PipelineId } from "./pipeline";

export type TableLayer = "source" | "silver" | "gold";

export interface SapTable {
  /** Fully qualified Unity Catalog name, e.g. ai_dataops_poc.sap_demo.sap_material_master */
  fqName: string;
  layer: TableLayer;
  description: string;
}

export interface JobDefinition {
  id: JobId;
  order: number;
  label: string;
  pipelineIds: PipelineId[];
}

/**
 * One processing unit within a job: the notebook it runs, and the tables it
 * reads from / writes to. This is the authoritative lineage record — every
 * lineage or context view in the app resolves against this, rather than
 * duplicating table names into pipeline executions or incidents.
 */
export interface PipelineDefinition {
  id: PipelineId;
  label: string;
  jobId: JobId;
  notebook: string;
  sourceTables: string[];
  targetTable: string;
}

export interface CountryDefinition {
  code: CountryCode;
  label: string;
}
