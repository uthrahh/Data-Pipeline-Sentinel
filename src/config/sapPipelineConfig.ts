import type {
  CountryDefinition,
  JobDefinition,
  JobId,
  PipelineDefinition,
  SapTable,
} from "@/types";

/**
 * The authoritative description of the SAP pipeline ecosystem Sentinel AI
 * Pipeline monitors: 3 Databricks jobs, 4 notebooks/processing units, and
 * their source -> silver -> gold lineage. Every part of the app (tables,
 * filters, dependency diagram, incident context, chat assistant) resolves
 * job/notebook/table/country information from here rather than hardcoding
 * it — extend this file to add a pipeline, job, or country, and the rest of
 * the app picks it up.
 */

export const SAP_TABLES: SapTable[] = [
  { fqName: "ai_dataops_poc.sap_demo.sap_material_master", layer: "source", description: "Raw SAP material master extract." },
  { fqName: "ai_dataops_poc.sap_demo.sap_vendor_material", layer: "source", description: "Raw SAP vendor-material purchasing info." },
  { fqName: "ai_dataops_poc.sap_demo.sap_sales_order_item", layer: "source", description: "Raw SAP sales order line items." },
  { fqName: "ai_dataops_poc.sap_demo.material_master_silver", layer: "silver", description: "Standardized material master." },
  { fqName: "ai_dataops_poc.sap_demo.procurement_silver", layer: "silver", description: "Material master joined with vendor purchasing terms." },
  { fqName: "ai_dataops_poc.sap_demo.sales_manufacturing_silver", layer: "silver", description: "Transformed sales and manufacturing order data." },
  { fqName: "ai_dataops_poc.sap_demo.material_supply_sales_gold", layer: "gold", description: "Unified material supply and sales gold table." },
];

export const JOBS: JobDefinition[] = [
  { id: "job1_material_master", order: 1, label: "Material Master Processing", pipelineIds: ["material_master_processing"] },
  { id: "job2_procurement_sales", order: 2, label: "Procurement & Sales Processing", pipelineIds: ["procurement_processing", "sales_processing"] },
  { id: "job3_gold_integration", order: 3, label: "Gold Integration", pipelineIds: ["gold_integration"] },
];

export const PIPELINES: PipelineDefinition[] = [
  {
    id: "material_master_processing",
    label: "Material Master Processing",
    jobId: "job1_material_master",
    notebook: "01_standardize_material_master",
    sourceTables: ["ai_dataops_poc.sap_demo.sap_material_master"],
    targetTable: "ai_dataops_poc.sap_demo.material_master_silver",
  },
  {
    id: "procurement_processing",
    label: "Procurement Processing",
    jobId: "job2_procurement_sales",
    notebook: "02_procurement_transformation",
    sourceTables: ["ai_dataops_poc.sap_demo.material_master_silver", "ai_dataops_poc.sap_demo.sap_vendor_material"],
    targetTable: "ai_dataops_poc.sap_demo.procurement_silver",
  },
  {
    id: "sales_processing",
    label: "Sales Processing",
    jobId: "job2_procurement_sales",
    notebook: "03_sales_manufacturing_transformation",
    sourceTables: ["ai_dataops_poc.sap_demo.sap_sales_order_item"],
    targetTable: "ai_dataops_poc.sap_demo.sales_manufacturing_silver",
  },
  {
    id: "gold_integration",
    label: "Gold Integration",
    jobId: "job3_gold_integration",
    notebook: "04_material_supply_sales_gold",
    sourceTables: [
      "ai_dataops_poc.sap_demo.material_master_silver",
      "ai_dataops_poc.sap_demo.procurement_silver",
      "ai_dataops_poc.sap_demo.sales_manufacturing_silver",
    ],
    targetTable: "ai_dataops_poc.sap_demo.material_supply_sales_gold",
  },
];

/**
 * Preserved exactly as provided by the product spec: the fourth environment
 * is labeled "Germany" under the BE code. Not a typo — do not "correct" it.
 */
export const COUNTRIES: CountryDefinition[] = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "SG", label: "Singapore" },
  { code: "BE", label: "Germany" },
];

const jobById = new Map(JOBS.map((j) => [j.id, j]));
const pipelineById = new Map(PIPELINES.map((p) => [p.id, p]));
const countryByCode = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getJob(jobId: JobId): JobDefinition {
  const job = jobById.get(jobId);
  if (!job) throw new Error(`Unknown jobId: ${jobId}`);
  return job;
}

export function getPipeline(pipelineId: string): PipelineDefinition | undefined {
  return pipelineById.get(pipelineId as PipelineDefinition["id"]);
}

export function getJobForPipeline(pipelineId: string): JobDefinition | undefined {
  const pipeline = getPipeline(pipelineId);
  return pipeline ? jobById.get(pipeline.jobId) : undefined;
}

export function getCountry(code: string): CountryDefinition | undefined {
  return countryByCode.get(code as CountryDefinition["code"]);
}

export function getCountryLabel(code: string): string {
  return getCountry(code)?.label ?? code;
}
