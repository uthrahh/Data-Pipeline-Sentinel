export type TableRole = "SOURCE" | "RESULT";
export type CheckResult = "PASS" | "WARNING" | "FAIL";

export interface ValidationTable {
  fqName: string;
  tableName: string;
  role: TableRole;
  rowCount: number;
  columnCount: number;
  lastLoadedAt: string;
  loadType: "Full Load" | "Incremental";
  layer: string;
}

/**
 * The same seven Unity Catalog tables used by the pipelines
 * (ai_dataops_poc.sap_demo). Row counts, column counts and last-load times
 * are real metadata pulled from the workspace.
 */
export const VALIDATION_TABLES: ValidationTable[] = [
  { fqName: "ai_dataops_poc.sap_demo.sap_material_master", tableName: "sap_material_master", role: "SOURCE", rowCount: 10, columnCount: 13, lastLoadedAt: "2026-09-11T11:49:37.000Z", loadType: "Full Load", layer: "Source" },
  { fqName: "ai_dataops_poc.sap_demo.sap_vendor_material", tableName: "sap_vendor_material", role: "SOURCE", rowCount: 10, columnCount: 12, lastLoadedAt: "2026-09-11T11:50:02.000Z", loadType: "Full Load", layer: "Source" },
  { fqName: "ai_dataops_poc.sap_demo.sap_sales_order_item", tableName: "sap_sales_order_item", role: "SOURCE", rowCount: 12, columnCount: 11, lastLoadedAt: "2026-09-13T00:28:50.000Z", loadType: "Full Load", layer: "Source" },
  { fqName: "ai_dataops_poc.sap_demo.material_master_silver", tableName: "material_master_silver", role: "RESULT", rowCount: 10, columnCount: 15, lastLoadedAt: "2026-09-28T13:04:34.000Z", loadType: "Incremental", layer: "Silver" },
  { fqName: "ai_dataops_poc.sap_demo.procurement_silver", tableName: "procurement_silver", role: "RESULT", rowCount: 10, columnCount: 16, lastLoadedAt: "2026-09-11T14:26:59.000Z", loadType: "Incremental", layer: "Silver" },
  { fqName: "ai_dataops_poc.sap_demo.sales_manufacturing_silver", tableName: "sales_manufacturing_silver", role: "RESULT", rowCount: 12, columnCount: 17, lastLoadedAt: "2026-09-11T12:20:25.000Z", loadType: "Incremental", layer: "Silver" },
  { fqName: "ai_dataops_poc.sap_demo.material_supply_sales_gold", tableName: "material_supply_sales_gold", role: "RESULT", rowCount: 10, columnCount: 27, lastLoadedAt: "2026-09-11T12:31:10.000Z", loadType: "Full Load", layer: "Gold" },
];

export interface DqCheck {
  index: number;
  name: string;
  detects: string;
  example: string;
  check: string;
  threshold: string;
  /** Which outcomes this check can produce. */
  outcomes: CheckResult[];
  passText: (n: number) => string;
  warnText?: (n: number) => string;
  failText: (n: number) => string;
}

export const DQ_CHECKS: DqCheck[] = [
  {
    index: 1,
    name: "Row Count / Record Count",
    detects: "Missing or unexpectedly low/high data",
    example: "Yesterday: 1M rows → Today: 500K",
    check: "Record count",
    threshold: "< 90% of expected",
    outcomes: ["PASS", "FAIL"],
    passText: (n) => `Row count is ${95 + (n % 6)}% of expected`,
    failText: (n) => `Row count is ${40 + (n % 40)}% of expected (< 90%)`,
  },
  {
    index: 2,
    name: "NULL / Missing Values",
    detects: "Required fields are missing",
    example: "customer_id IS NULL",
    check: "NULL",
    threshold: "> 5%",
    outcomes: ["PASS", "FAIL"],
    passText: (n) => `NULL ratio is ${(n % 30) / 10}% on required columns`,
    failText: (n) => `NULL ratio is ${(5.5 + (n % 70) / 10).toFixed(1)}% on required columns (> 5%)`,
  },
  {
    index: 3,
    name: "Duplicate Records",
    detects: "Duplicate business/complete records",
    example: "Same order_id appears twice",
    check: "Duplicate",
    threshold: "> 0% for PK",
    outcomes: ["PASS", "FAIL"],
    passText: () => "0 duplicate records found",
    failText: (n) => `${2 + (n % 30)} duplicate records found`,
  },
  {
    index: 4,
    name: "Primary Key Uniqueness",
    detects: "Duplicate values in key columns",
    example: "Two rows have same order_id",
    check: "PK uniqueness",
    threshold: "Any duplicate",
    outcomes: ["PASS", "FAIL"],
    passText: () => "All primary key values are unique",
    failText: (n) => `${1 + (n % 4)} duplicate primary key values`,
  },
  {
    index: 5,
    name: "Referential Integrity",
    detects: "Invalid foreign-key relationships",
    example: "product_id doesn't exist in product master",
    check: "Referential integrity",
    threshold: "> 1% invalid",
    outcomes: ["PASS", "FAIL"],
    passText: () => "0.0% orphaned foreign keys",
    failText: (n) => `${(1.4 + (n % 40) / 10).toFixed(1)}% foreign keys have no parent (> 1%)`,
  },
  {
    index: 6,
    name: "Data Type / Format Validation",
    detects: "Incorrect data formats/types",
    example: "Invalid date, malformed email, numeric field containing text",
    check: "Format/type",
    threshold: "Any critical-field violation",
    outcomes: ["PASS", "FAIL"],
    passText: () => "No format or type violations on critical fields",
    failText: (n) => `${1 + (n % 12)} rows violate date/number format on critical fields`,
  },
  {
    index: 7,
    name: "Domain / Allowed Values",
    detects: "Invalid categorical values",
    example: "country = 'XX' when only US/CA/DE are allowed",
    check: "Allowed values",
    threshold: "> 0% invalid",
    outcomes: ["PASS", "WARNING", "FAIL"],
    passText: () => "All values are within the allowed set",
    warnText: (n) => `${(0.1 + (n % 8) / 10).toFixed(1)}% of values are outside the allowed set`,
    failText: (n) => `${(2 + (n % 30) / 10).toFixed(1)}% of values are outside the allowed set`,
  },
  {
    index: 8,
    name: "Range / Business Rule Validation",
    detects: "Values outside expected business limits",
    example: "quantity < 0, discount > 100%",
    check: "Range",
    threshold: "> 1% invalid",
    outcomes: ["PASS", "WARNING", "FAIL"],
    passText: () => "All values are within business limits",
    warnText: (n) => `${(0.2 + (n % 7) / 10).toFixed(1)}% of values are out of range`,
    failText: (n) => `${(1.5 + (n % 25) / 10).toFixed(1)}% of values are out of range (> 1%)`,
  },
  {
    index: 9,
    name: "Freshness / Timeliness",
    detects: "Data hasn't arrived/updated on time",
    example: "Latest load_timestamp is 8 hours old",
    check: "Freshness",
    threshold: "> SLA threshold",
    outcomes: ["PASS", "FAIL"],
    passText: (n) => `Latest load is ${10 + (n % 50)} minutes old`,
    failText: (n) => `Latest load is ${3 + (n % 9)} hours old (> SLA threshold)`,
  },
  {
    index: 10,
    name: "Volume / Distribution Anomaly",
    detects: "Significant unexpected changes in data patterns",
    example: "Sales normally 900K–1.1M, suddenly 50K",
    check: "Volume anomaly",
    threshold: "> 20% deviation",
    outcomes: ["PASS", "WARNING"],
    passText: (n) => `Volume deviates ${2 + (n % 14)}% from the normal range`,
    warnText: (n) => `Volume deviates ${21 + (n % 40)}% from the normal range (> 20%)`,
    failText: (n) => `Volume deviates ${60 + (n % 30)}% from the normal range`,
  },
];

export interface CheckOutcome {
  result: CheckResult;
  detail: string;
  ranAt: string;
}

/** Simulated test run: a random (but threshold-consistent) result for the given check. */
export function runCheck(check: DqCheck, random: () => number = Math.random): CheckOutcome {
  const roll = random();
  const n = Math.floor(random() * 1000);
  let result: CheckResult = "PASS";
  if (check.outcomes.includes("WARNING") && check.outcomes.includes("FAIL")) {
    result = roll < 0.6 ? "PASS" : roll < 0.82 ? "WARNING" : "FAIL";
  } else if (check.outcomes.includes("WARNING")) {
    result = roll < 0.7 ? "PASS" : "WARNING";
  } else {
    result = roll < 0.68 ? "PASS" : "FAIL";
  }
  const detail = result === "PASS" ? check.passText(n) : result === "WARNING" ? (check.warnText ?? check.failText)(n) : check.failText(n);
  return { result, detail, ranAt: new Date().toISOString() };
}
