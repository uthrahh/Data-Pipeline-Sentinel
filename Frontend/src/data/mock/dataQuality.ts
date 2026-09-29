import type { DataQualityTable } from "@/types";

/**
 * Real table metadata pulled directly from `ai_dataops_poc.sap_demo` (row
 * counts via `SELECT COUNT(*)`, last-loaded via `DESCRIBE DETAIL`, null
 * counts via a per-column `SUM(CASE WHEN col IS NULL ...)` scan) on
 * 2026-09-29, then hardcoded here — this is a static site with no live
 * backend connection, so it can't re-query the warehouse at runtime.
 */
export const DATA_QUALITY_TABLES: DataQualityTable[] = [
  {
    fqName: "ai_dataops_poc.sap_demo.sap_material_master",
    tableName: "sap_material_master",
    rowCount: 10,
    lastLoadedAt: "2026-09-11T11:49:37.000Z",
    loadType: "FULL_LOAD",
    nullValueCount: 0,
    columnCount: 13,
    dqStatus: "PASS",
    dqNote: "No null values detected across any of the 13 columns.",
  },
  {
    fqName: "ai_dataops_poc.sap_demo.sap_vendor_material",
    tableName: "sap_vendor_material",
    rowCount: 10,
    lastLoadedAt: "2026-09-11T11:50:02.000Z",
    loadType: "FULL_LOAD",
    nullValueCount: 0,
    columnCount: 12,
    dqStatus: "PASS",
    dqNote: "No null values detected across any of the 12 columns.",
  },
  {
    fqName: "ai_dataops_poc.sap_demo.sap_sales_order_item",
    tableName: "sap_sales_order_item",
    rowCount: 12,
    lastLoadedAt: "2026-09-13T00:28:50.000Z",
    loadType: "FULL_LOAD",
    nullValueCount: 0,
    columnCount: 11,
    dqStatus: "PASS",
    dqNote: "No null values detected across any of the 11 columns.",
  },
  {
    fqName: "ai_dataops_poc.sap_demo.material_master_silver",
    tableName: "material_master_silver",
    rowCount: 10,
    lastLoadedAt: "2026-09-28T13:04:34.000Z",
    loadType: "INCREMENTAL",
    nullValueCount: 0,
    columnCount: 15,
    dqStatus: "PASS",
    dqNote: "No null values detected across any of the 15 columns.",
  },
  {
    fqName: "ai_dataops_poc.sap_demo.procurement_silver",
    tableName: "procurement_silver",
    rowCount: 10,
    lastLoadedAt: "2026-09-11T14:26:59.000Z",
    loadType: "INCREMENTAL",
    nullValueCount: 0,
    columnCount: 16,
    dqStatus: "PASS",
    dqNote: "No null values detected across any of the 16 columns.",
  },
  {
    fqName: "ai_dataops_poc.sap_demo.sales_manufacturing_silver",
    tableName: "sales_manufacturing_silver",
    rowCount: 12,
    lastLoadedAt: "2026-09-11T12:20:25.000Z",
    loadType: "INCREMENTAL",
    nullValueCount: 0,
    columnCount: 17,
    dqStatus: "PASS",
    dqNote: "No null values detected across any of the 17 columns.",
  },
  {
    fqName: "ai_dataops_poc.sap_demo.material_supply_sales_gold",
    tableName: "material_supply_sales_gold",
    rowCount: 10,
    lastLoadedAt: "2026-09-11T12:31:10.000Z",
    loadType: "FULL_LOAD",
    nullValueCount: 0,
    columnCount: 27,
    dqStatus: "PASS",
    dqNote: "No null values detected across any of the 27 columns.",
  },
];
