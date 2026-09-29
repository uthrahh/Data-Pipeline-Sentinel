/**
 * The Data Quality Check-up list (Overview page -> "Data Health Check" box).
 * Backed by the real tables in `ai_dataops_poc.sap_demo` — row counts, last
 * loaded timestamps, and null counts were pulled directly from that catalog
 * (see the table below) and hardcoded here, since this is a static site with
 * no live backend connection. Not re-queried at runtime.
 */

export type LoadType = "FULL_LOAD" | "INCREMENTAL" | "CDC";

export interface DataQualityTable {
  /** Fully qualified Unity Catalog name, e.g. ai_dataops_poc.sap_demo.sap_material_master */
  fqName: string;
  tableName: string;
  rowCount: number;
  lastLoadedAt: string;
  loadType: LoadType;
  /** Total NULL cells found across all columns, last time this was checked. */
  nullValueCount: number;
  columnCount: number;
  dqStatus: "PASS" | "FAIL";
  dqNote: string;
}
