import type { DQResult, Incident, Investigation, SLAResult } from "@/types";
import { summarizeDQ, summarizeSLA } from "@/lib/incidentNarratives";

/**
 * Incident fixtures for the SAP pipeline ecosystem, covering every lifecycle
 * state: OPEN, INVESTIGATING, WAITING_APPROVAL, APPROVED, REMEDIATING,
 * REMEDIATION_FAILED, VALIDATING, VALIDATION_FAILED, RESOLVED, REJECTED.
 *
 * Authored without `processSteps` (Investigation/DQ/SLA) or `summary`
 * (DQ/SLA) — those are the agent's methodology trail and derived narrative,
 * appended below in one place rather than repeated on every fixture.
 */
type RawInvestigation = Omit<Investigation, "processSteps">;
type RawDQResult = Omit<DQResult, "processSteps" | "summary">;
type RawSLAResult = Omit<SLAResult, "processSteps" | "summary">;
type RawIncident = Omit<Incident, "investigation" | "dq" | "sla"> & {
  investigation: RawInvestigation | null;
  dq: RawDQResult | null;
  sla: RawSLAResult | null;
};

const RAW_INCIDENTS: RawIncident[] = [
  // 1. Waiting on a human decision.
  {
    incidentId: "INC-7F3A9C21",
    pipelineRunId: "RUN-8a41f2c9",
    pipelineId: "material_master_processing",
    pipelineName: "Material Master Processing",
    country: "US",
    status: "WAITING_APPROVAL",
    severity: "HIGH",
    detectedAt: "2026-09-15T02:08:00Z",
    assignee: "T. Alvarez",
    failure: {
      errorCode: "SAP-4102",
      errorType: "DataError",
      errorMessage:
        "Schema mismatch: sap_material_master now includes a new column (base_unit_of_measure_2) not present in the notebook's expected schema.",
      target: "01_standardize_material_master",
      runPageUrl:
        "https://adb-6265899644784264.4.azuredatabricks.net/?o=6265899644784264#job/311043726/run/1034455167",
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-15T02:10:30Z",
      rootCause:
        "The sap_material_master source table now includes a new column (base_unit_of_measure_2) that the notebook's expected schema does not define, causing schema validation to reject the batch before it could write to material_master_silver.",
      confidencePct: 92,
      evidence: [
        "Column base_unit_of_measure_2 first appeared in sap_material_master at 01:55Z, 5 minutes before this run started.",
        "No other structural changes detected in the source schema.",
        "The notebook's schema enforcement is strict (fails closed) rather than permissive.",
      ],
      impact:
        "Material master data will not refresh for US today; downstream Procurement and Gold Integration for US will run against yesterday's material master until this is resolved.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Add the new column to the notebook's expected schema (or drop it before the write), then rerun.",
    },
    dq: { status: "COMPLETE", completedAt: "2026-09-15T02:10:30Z", checks: [{ metric: "Record Count", actual: "0", expected: "> 0", status: "FAIL" }] },
    sla: { status: "FAIL", configuredMinutes: 20, actualMinutes: 8, varianceMinutes: null, criticality: "HIGH" },
    recommendation: {
      action: "Update 01_standardize_material_master's schema to accept base_unit_of_measure_2, then rerun for US",
      reason: "The new column is additive; accepting it is a low-risk fix that matches the exact structural change detected.",
      expectedOutcome: "Material master standardization completes and material_master_silver refreshes for US.",
      risk: "LOW",
      confidencePct: 90,
    },
    approval: { requestedAt: "2026-09-15T02:11:00Z", decidedAt: null, decidedBy: null, decision: null, rejectionReason: null },
    remediation: null,
    postValidation: null,
    audit: [
      { id: "a1", timestamp: "2026-09-15T02:07:47Z", label: "Pipeline execution failed", actor: "system", detail: "01_standardize_material_master terminated with error code SAP-4102." },
      { id: "a2", timestamp: "2026-09-15T02:08:00Z", label: "Incident created", actor: "system", detail: "INC-7F3A9C21 opened and assigned severity HIGH." },
      { id: "a3", timestamp: "2026-09-15T02:08:20Z", label: "AI investigation started", actor: "ai", detail: null },
      { id: "a4", timestamp: "2026-09-15T02:10:30Z", label: "Investigation completed", actor: "ai", detail: "Root cause: unexpected new column in sap_material_master." },
      { id: "a5", timestamp: "2026-09-15T02:10:30Z", label: "DQ validation completed", actor: "system", detail: "0 records written." },
      { id: "a6", timestamp: "2026-09-15T02:10:30Z", label: "SLA validation completed", actor: "system", detail: "Failed before completion — SLA breached." },
      { id: "a7", timestamp: "2026-09-15T02:11:00Z", label: "Recommendation generated", actor: "ai", detail: "Update schema and rerun — 90% confidence." },
      { id: "a8", timestamp: "2026-09-15T02:11:00Z", label: "Waiting on human approval", actor: "system", detail: null },
    ],
  },

  // 2. Fresh failure, investigation not yet started.
  {
    incidentId: "INC-6B48D2E7",
    pipelineRunId: "RUN-c81b5f06",
    pipelineId: "material_master_processing",
    pipelineName: "Material Master Processing",
    country: "CA",
    status: "OPEN",
    severity: "HIGH",
    detectedAt: "2026-09-15T02:05:10Z",
    assignee: null,
    failure: {
      errorCode: "SAP-4105",
      errorType: "DataError",
      errorMessage:
        "Duplicate material_id values detected in the sap_material_master extract; the notebook enforces uniqueness on write to material_master_silver.",
      target: "01_standardize_material_master",
      runPageUrl:
        "https://adb-6265899644784264.4.azuredatabricks.net/?o=6265899644784264#job/311043726/run/1034455201",
    },
    investigation: { status: "PENDING", completedAt: null, rootCause: "", confidencePct: 0, evidence: [], impact: "", transientOrSystemic: "TRANSIENT", recommendedAction: "" },
    dq: { status: "PENDING", completedAt: null, checks: [] },
    sla: { status: "NOT_AVAILABLE", configuredMinutes: 20, actualMinutes: null, varianceMinutes: null, criticality: null },
    recommendation: null,
    approval: null,
    remediation: null,
    postValidation: null,
    audit: [
      { id: "a1", timestamp: "2026-09-15T02:04:58Z", label: "Pipeline execution failed", actor: "system", detail: "01_standardize_material_master terminated with error code SAP-4105." },
      { id: "a2", timestamp: "2026-09-15T02:05:10Z", label: "Incident created", actor: "system", detail: "INC-6B48D2E7 opened and queued for investigation." },
    ],
  },

  // 3. Investigation + DQ/SLA complete, recommendation not yet generated.
  {
    incidentId: "INC-D391AA02",
    pipelineRunId: "RUN-94d6d6b7",
    pipelineId: "procurement_processing",
    pipelineName: "Procurement Processing",
    country: "SG",
    status: "INVESTIGATING",
    severity: "HIGH",
    detectedAt: "2026-09-15T02:22:50Z",
    assignee: "P. Reddy",
    failure: {
      errorCode: "SAP-4210",
      errorType: "DataError",
      errorMessage:
        "Join between material_master_silver and sap_vendor_material produced a row explosion — sap_vendor_material appears to contain duplicate vendor_id/material_id pairs.",
      target: "02_procurement_transformation",
      runPageUrl:
        "https://adb-6265899644784264.4.azuredatabricks.net/?o=6265899644784264#job/311043727/run/2110288341",
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-15T02:26:10Z",
      rootCause:
        "sap_vendor_material contains duplicate vendor_id/material_id pairs for SG, so the join against material_master_silver multiplies matching rows instead of producing a 1:1 enrichment.",
      confidencePct: 81,
      evidence: [
        "Row count after the join is 4.2x the row count of material_master_silver for SG, versus the usual ~1.1x.",
        "Duplicate (vendor_id, material_id) pairs found directly in the raw sap_vendor_material extract for SG.",
        "No equivalent duplication seen in the last 14 days of runs.",
      ],
      impact: "Procurement data for SG will be inflated and unreliable until deduplicated; Gold Integration for SG should not proceed on top of it.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Deduplicate sap_vendor_material on (vendor_id, material_id) before the join, keeping the most recent record, then rerun.",
    },
    dq: {
      status: "COMPLETE",
      completedAt: "2026-09-15T02:26:10Z",
      checks: [
        { metric: "Record Count", actual: "148,220", expected: "~ 35,000", status: "FAIL" },
        { metric: "Duplicate Vendor-Material Pairs", actual: "1,860", expected: "0", status: "FAIL" },
      ],
    },
    sla: { status: "FAIL", configuredMinutes: 25, actualMinutes: 7, varianceMinutes: null, criticality: "HIGH" },
    recommendation: null,
    approval: null,
    remediation: null,
    postValidation: null,
    audit: [
      { id: "a1", timestamp: "2026-09-15T02:22:37Z", label: "Pipeline execution failed", actor: "system", detail: "02_procurement_transformation terminated with error code SAP-4210." },
      { id: "a2", timestamp: "2026-09-15T02:22:50Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-15T02:23:10Z", label: "AI investigation started", actor: "ai", detail: null },
      { id: "a4", timestamp: "2026-09-15T02:26:10Z", label: "Investigation completed", actor: "ai", detail: "Root cause: duplicate vendor-material pairs in sap_vendor_material." },
      { id: "a5", timestamp: "2026-09-15T02:26:10Z", label: "DQ validation completed", actor: "system", detail: "Row count 4.2x expected." },
      { id: "a6", timestamp: "2026-09-15T02:26:10Z", label: "SLA validation completed", actor: "system", detail: null },
      { id: "a7", timestamp: "2026-09-15T02:26:20Z", label: "Generating remediation recommendation", actor: "ai", detail: null },
    ],
  },

  // 4. Approved, remediation actively running.
  {
    incidentId: "INC-B4C1E890",
    pipelineRunId: "RUN-5f578b76",
    pipelineId: "procurement_processing",
    pipelineName: "Procurement Processing",
    country: "BE",
    status: "REMEDIATING",
    severity: "MEDIUM",
    detectedAt: "2026-09-15T02:19:50Z",
    assignee: "L. Fontaine",
    failure: {
      errorCode: "SAP-4215",
      errorType: "DataError",
      errorMessage: "Null purchase_price for 340 rows — sap_vendor_material rows missing a currency_code caused the price normalization step to fail.",
      target: "02_procurement_transformation",
      runPageUrl:
        "https://adb-6265899644784264.4.azuredatabricks.net/?o=6265899644784264#job/311043727/run/2110288402",
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-15T02:22:40Z",
      rootCause:
        "340 rows in sap_vendor_material for BE are missing a currency_code, so the price-normalization step cannot resolve an exchange rate and fails the batch.",
      confidencePct: 88,
      evidence: [
        "340 of 3,120 BE vendor-material rows have a null currency_code.",
        "All affected rows were added in the last 2 days, suggesting an upstream vendor onboarding gap.",
        "Rows with a populated currency_code process normally.",
      ],
      impact: "Procurement data for BE will not refresh until the affected rows are handled.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Default missing currency_code to the vendor's country currency for this run, then flag the rows for data-steward follow-up.",
    },
    dq: {
      status: "COMPLETE",
      completedAt: "2026-09-15T02:22:40Z",
      checks: [
        { metric: "Record Count", actual: "0", expected: "> 0", status: "FAIL" },
        { metric: "Null Currency Code", actual: "340", expected: "0", status: "FAIL" },
      ],
    },
    sla: { status: "FAIL", configuredMinutes: 25, actualMinutes: 3, varianceMinutes: null, criticality: "MEDIUM" },
    recommendation: {
      action: "Default missing currency_code to EUR for affected BE rows and rerun",
      reason: "Isolates a known, low-risk default for a clearly identified gap without altering unaffected rows.",
      expectedOutcome: "Procurement processing completes for BE with the 340 rows flagged for follow-up.",
      risk: "LOW",
      confidencePct: 84,
    },
    approval: { requestedAt: "2026-09-15T02:23:00Z", decidedAt: "2026-09-15T02:26:00Z", decidedBy: "L. Fontaine", decision: "APPROVED", rejectionReason: null },
    remediation: {
      remediationRunId: "RUN-REM-b4c1e890",
      originalRunId: "RUN-5f578b76",
      startedAt: "2026-09-15T02:27:00Z",
      completedAt: null,
      status: "RUNNING",
      error: null,
    },
    postValidation: null,
    audit: [
      { id: "a1", timestamp: "2026-09-15T02:19:41Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-15T02:19:50Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-15T02:22:40Z", label: "Investigation completed", actor: "ai", detail: "Root cause: missing currency codes on 340 vendor rows." },
      { id: "a4", timestamp: "2026-09-15T02:22:40Z", label: "DQ validation completed", actor: "system", detail: null },
      { id: "a5", timestamp: "2026-09-15T02:22:40Z", label: "SLA validation completed", actor: "system", detail: null },
      { id: "a6", timestamp: "2026-09-15T02:23:00Z", label: "Recommendation generated", actor: "ai", detail: "Default currency and rerun — 84% confidence." },
      { id: "a7", timestamp: "2026-09-15T02:26:00Z", label: "Human approval received", actor: "human", detail: "Approved by L. Fontaine." },
      { id: "a8", timestamp: "2026-09-15T02:27:00Z", label: "Remediation started", actor: "system", detail: "Run RUN-REM-b4c1e890 launched." },
    ],
  },

  // 5. Remediation attempted and failed — escalated.
  {
    incidentId: "INC-E5288FF6",
    pipelineRunId: "RUN-a920fe11",
    pipelineId: "sales_processing",
    pipelineName: "Sales Processing",
    country: "US",
    status: "REMEDIATION_FAILED",
    severity: "HIGH",
    detectedAt: "2026-09-15T02:54:00Z",
    assignee: "S. Okafor",
    failure: {
      errorCode: "SAP-4310",
      errorType: "DataError",
      errorMessage:
        "sap_sales_order_item.order_date arrived in an unexpected format (MM/DD/YYYY instead of ISO), causing the date parser in 03_sales_manufacturing_transformation to fail.",
      target: "03_sales_manufacturing_transformation",
      runPageUrl:
        "https://adb-6265899644784264.4.azuredatabricks.net/?o=6265899644784264#job/311043728/run/3010288341",
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-15T02:57:00Z",
      rootCause:
        "sap_sales_order_item.order_date for US arrived in MM/DD/YYYY format instead of the expected ISO 8601 format, causing the date parser to throw on the first non-parseable row.",
      confidencePct: 90,
      evidence: [
        "Sampled rows show order_date values like '09/15/2026' instead of '2026-09-15'.",
        "This format last appeared 3 weeks ago during a prior SAP extract configuration change.",
        "Only the US extract is affected; CA/SG/BE order_date values are ISO-formatted.",
      ],
      impact: "Sales and manufacturing data for US will not refresh; Gold Integration for US should not proceed.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Add an explicit date-format fallback for MM/DD/YYYY in the notebook's date parser, then rerun for US.",
    },
    dq: { status: "COMPLETE", completedAt: "2026-09-15T02:57:00Z", checks: [{ metric: "Record Count", actual: "0", expected: "> 0", status: "FAIL" }] },
    sla: { status: "FAIL", configuredMinutes: 30, actualMinutes: 48, varianceMinutes: null, criticality: "HIGH" },
    recommendation: {
      action: "Patch the date parser to accept MM/DD/YYYY and rerun Sales Processing for US",
      reason: "The format is a known, previously-seen variant; a fallback parser handles it without affecting the ISO-formatted path used by other countries.",
      expectedOutcome: "Sales Processing completes and sales_manufacturing_silver refreshes for US.",
      risk: "LOW",
      confidencePct: 83,
    },
    approval: { requestedAt: "2026-09-15T02:58:00Z", decidedAt: "2026-09-15T03:02:00Z", decidedBy: "S. Okafor", decision: "APPROVED", rejectionReason: null },
    remediation: {
      remediationRunId: "RUN-REM-e5288ff6",
      originalRunId: "RUN-a920fe11",
      startedAt: "2026-09-15T03:03:00Z",
      completedAt: "2026-09-15T03:19:00Z",
      status: "FAILED",
      error:
        "Databricks execution failed with error state: Terminated. The MM/DD/YYYY fallback resolved most rows, but 12 rows contained a third format (YYYY/MM/DD) that also failed to parse.",
    },
    postValidation: null,
    audit: [
      { id: "a1", timestamp: "2026-09-15T02:53:35Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-15T02:54:00Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-15T02:57:00Z", label: "Investigation completed", actor: "ai", detail: "Root cause: order_date format drift for US." },
      { id: "a4", timestamp: "2026-09-15T02:57:00Z", label: "DQ validation completed", actor: "system", detail: null },
      { id: "a5", timestamp: "2026-09-15T02:57:00Z", label: "SLA validation completed", actor: "system", detail: null },
      { id: "a6", timestamp: "2026-09-15T02:58:00Z", label: "Recommendation generated", actor: "ai", detail: "Patch date parser and rerun — 83% confidence." },
      { id: "a7", timestamp: "2026-09-15T03:02:00Z", label: "Human approval received", actor: "human", detail: "Approved by S. Okafor." },
      { id: "a8", timestamp: "2026-09-15T03:03:00Z", label: "Remediation started", actor: "system", detail: "Run RUN-REM-e5288ff6 launched." },
      { id: "a9", timestamp: "2026-09-15T03:19:00Z", label: "Remediation failed", actor: "system", detail: "A third date format (YYYY/MM/DD) was not covered by the fallback." },
      { id: "a10", timestamp: "2026-09-15T03:19:20Z", label: "Escalated for manual review", actor: "system", detail: "Auto-remediation exhausted; routed to on-call for a broader date-parsing fix." },
    ],
  },

  // 6. Remediation succeeded, but post-remediation validation failed — job success != data success.
  {
    incidentId: "INC-9A21D5C4",
    pipelineRunId: "RUN-77adc8fa",
    pipelineId: "sales_processing",
    pipelineName: "Sales Processing",
    country: "CA",
    status: "VALIDATION_FAILED",
    severity: "MEDIUM",
    detectedAt: "2026-09-15T02:09:00Z",
    assignee: "R. Kimura",
    failure: {
      errorCode: "SAP-4318",
      errorType: "DataError",
      errorMessage: "sap_sales_order_item extract for CA contained 60% fewer rows than the prior run.",
      target: "03_sales_manufacturing_transformation",
      runPageUrl:
        "https://adb-6265899644784264.4.azuredatabricks.net/?o=6265899644784264#job/311043728/run/3010288402",
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-15T02:12:00Z",
      rootCause:
        "The sap_sales_order_item extract for CA landed with 60% fewer rows than the prior run, but the notebook completed without error since row-count drops aren't a hard failure condition in the extract job.",
      confidencePct: 76,
      evidence: [
        "CA extract row count: 3,140 today vs. a 7,600 rolling average.",
        "No error or warning was raised by the upstream SAP extract job for CA.",
        "Other countries' extracts are within normal range.",
      ],
      impact: "Sales Processing output for CA is technically valid but almost certainly incomplete, understating CA sales in Gold Integration.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Re-trigger the upstream SAP extract for CA, then rerun Sales Processing once the full extract lands.",
    },
    dq: { status: "COMPLETE", completedAt: "2026-09-15T02:12:00Z", checks: [{ metric: "Record Count", actual: "3,140", expected: "~ 7,600", status: "FAIL" }] },
    sla: { status: "PASS", configuredMinutes: 30, actualMinutes: 3, varianceMinutes: 27, criticality: "LOW" },
    recommendation: {
      action: "Re-trigger the upstream SAP extract for CA and rerun Sales Processing",
      reason: "Root cause is an incomplete upstream extract, not a defect in this notebook.",
      expectedOutcome: "Sales Processing completes for CA with full row volume.",
      risk: "LOW",
      confidencePct: 80,
    },
    approval: { requestedAt: "2026-09-15T02:13:00Z", decidedAt: "2026-09-15T02:18:00Z", decidedBy: "R. Kimura", decision: "APPROVED", rejectionReason: null },
    remediation: {
      remediationRunId: "RUN-REM-9a21d5c4",
      originalRunId: "RUN-77adc8fa",
      startedAt: "2026-09-15T02:19:00Z",
      completedAt: "2026-09-15T02:31:00Z",
      status: "SUCCESS",
      error: null,
    },
    postValidation: { dqStatus: "FAIL", slaStatus: "PASS", overallStatus: "FAIL" },
    audit: [
      { id: "a1", timestamp: "2026-09-15T02:07:54Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-15T02:09:00Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-15T02:12:00Z", label: "Investigation completed", actor: "ai", detail: "Root cause: incomplete upstream SAP extract for CA." },
      { id: "a4", timestamp: "2026-09-15T02:12:00Z", label: "DQ validation completed", actor: "system", detail: null },
      { id: "a5", timestamp: "2026-09-15T02:12:00Z", label: "SLA validation completed", actor: "system", detail: null },
      { id: "a6", timestamp: "2026-09-15T02:13:00Z", label: "Recommendation generated", actor: "ai", detail: "Re-trigger extract and rerun — 80% confidence." },
      { id: "a7", timestamp: "2026-09-15T02:18:00Z", label: "Human approval received", actor: "human", detail: "Approved by R. Kimura." },
      { id: "a8", timestamp: "2026-09-15T02:19:00Z", label: "Remediation started", actor: "system", detail: "Run RUN-REM-9a21d5c4 launched." },
      { id: "a9", timestamp: "2026-09-15T02:31:00Z", label: "Remediation job succeeded", actor: "system", detail: "Notebook completed without errors." },
      { id: "a10", timestamp: "2026-09-15T02:33:00Z", label: "Post-remediation DQ failed", actor: "system", detail: "Record count landed at 3,410 vs. an expected baseline near 7,600 — the re-extract ran before the upstream SAP batch had fully posted." },
      { id: "a11", timestamp: "2026-09-15T02:33:05Z", label: "Validation failed — incident held open", actor: "system", detail: "Job success did not resolve the underlying data completeness issue." },
    ],
  },

  // 7. Fully resolved happy path.
  {
    incidentId: "INC-2C77B810",
    pipelineRunId: "RUN-64af02d1",
    pipelineId: "gold_integration",
    pipelineName: "Gold Integration",
    country: "SG",
    status: "RESOLVED",
    severity: "MEDIUM",
    detectedAt: "2026-09-15T03:11:30Z",
    assignee: "P. Reddy",
    failure: {
      errorCode: "SAP-4401",
      errorType: "InfrastructureError",
      errorMessage: "04_material_supply_sales_gold started before procurement_silver finished writing for SG — the read produced a stale/partial partition.",
      target: "04_material_supply_sales_gold",
      runPageUrl:
        "https://adb-6265899644784264.4.azuredatabricks.net/?o=6265899644784264#job/311043729/run/4010288341",
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-15T03:13:40Z",
      rootCause:
        "04_material_supply_sales_gold started reading procurement_silver for SG before Job 2's procurement branch had finished committing its write, so Gold Integration read a stale/partial partition.",
      confidencePct: 93,
      evidence: [
        "procurement_silver's SG partition was still being written 40 seconds after Gold Integration's read began.",
        "The dependency trigger fired on job-start rather than job-commit for this run.",
        "No data quality issue exists in procurement_silver once fully committed.",
      ],
      impact: "Gold Integration output for SG was delayed by under 15 minutes; no data correctness issue once rerun.",
      transientOrSystemic: "TRANSIENT",
      recommendedAction: "Rerun Gold Integration for SG now that procurement_silver has fully committed.",
    },
    dq: { status: "COMPLETE", completedAt: "2026-09-15T03:13:40Z", checks: [{ metric: "Record Count", actual: "N/A — partial read", expected: "> 0", status: "FAIL" }] },
    sla: { status: "FAIL", configuredMinutes: 20, actualMinutes: 7, varianceMinutes: null, criticality: "LOW" },
    recommendation: {
      action: "Rerun Gold Integration for SG",
      reason: "Root cause was a timing race on a dependency trigger, not a data or code defect — the source is now fully committed.",
      expectedOutcome: "Gold Integration completes and material_supply_sales_gold refreshes for SG.",
      risk: "LOW",
      confidencePct: 95,
    },
    approval: { requestedAt: "2026-09-15T03:14:00Z", decidedAt: "2026-09-15T03:16:00Z", decidedBy: "P. Reddy", decision: "APPROVED", rejectionReason: null },
    remediation: {
      remediationRunId: "RUN-REM-2c77b810",
      originalRunId: "RUN-64af02d1",
      startedAt: "2026-09-15T03:17:00Z",
      completedAt: "2026-09-15T03:29:00Z",
      status: "SUCCESS",
      error: null,
    },
    postValidation: { dqStatus: "PASS", slaStatus: "PASS", overallStatus: "PASS" },
    audit: [
      { id: "a1", timestamp: "2026-09-15T03:11:16Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-15T03:11:30Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-15T03:13:40Z", label: "Investigation completed", actor: "ai", detail: "Root cause: dependency trigger race against procurement_silver commit." },
      { id: "a4", timestamp: "2026-09-15T03:13:40Z", label: "DQ validation completed", actor: "system", detail: null },
      { id: "a5", timestamp: "2026-09-15T03:13:40Z", label: "SLA validation completed", actor: "system", detail: null },
      { id: "a6", timestamp: "2026-09-15T03:14:00Z", label: "Recommendation generated", actor: "ai", detail: "Rerun once source is committed — 95% confidence." },
      { id: "a7", timestamp: "2026-09-15T03:16:00Z", label: "Human approval received", actor: "human", detail: "Approved by P. Reddy." },
      { id: "a8", timestamp: "2026-09-15T03:17:00Z", label: "Remediation started", actor: "system", detail: "Run RUN-REM-2c77b810 launched." },
      { id: "a9", timestamp: "2026-09-15T03:29:00Z", label: "Remediation completed", actor: "system", detail: "Gold Integration completed successfully." },
      { id: "a10", timestamp: "2026-09-15T03:30:10Z", label: "Post-remediation DQ completed", actor: "system", detail: "All checks passed." },
      { id: "a11", timestamp: "2026-09-15T03:30:25Z", label: "SLA validation completed", actor: "system", detail: "Completed within configured SLA." },
      { id: "a12", timestamp: "2026-09-15T03:30:40Z", label: "Incident resolved", actor: "system", detail: null },
    ],
  },

  // 8. Human rejected the AI recommendation.
  {
    incidentId: "INC-1F0AC6D3",
    pipelineRunId: "RUN-b311aa02",
    pipelineId: "gold_integration",
    pipelineName: "Gold Integration",
    country: "BE",
    status: "REJECTED",
    severity: "MEDIUM",
    detectedAt: "2026-09-15T03:11:50Z",
    assignee: "Data Steward (BE)",
    failure: {
      errorCode: "SAP-4407",
      errorType: "DataError",
      errorMessage:
        "Join key mismatch: material_id format differs between procurement_silver (10-digit, zero-padded) and sales_manufacturing_silver (unpadded) for a subset of BE materials.",
      target: "04_material_supply_sales_gold",
      runPageUrl:
        "https://adb-6265899644784264.4.azuredatabricks.net/?o=6265899644784264#job/311043729/run/4010288402",
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-15T03:14:20Z",
      rootCause:
        "material_id is zero-padded to 10 digits in procurement_silver but unpadded in sales_manufacturing_silver for a subset of BE materials, so the Gold Integration join misses those rows.",
      confidencePct: 79,
      evidence: [
        "18 of 640 BE material_ids fail to match across the two silver tables.",
        "All 18 mismatches are BE materials created in the last SAP onboarding batch.",
        "The padding inconsistency traces back to a difference in how each notebook casts material_id.",
      ],
      impact: "Gold Integration for BE will under-represent 18 materials until the key format is reconciled.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Normalize material_id padding in the join (auto-pad both sides to 10 digits) and rerun.",
    },
    dq: {
      status: "COMPLETE",
      completedAt: "2026-09-15T03:14:20Z",
      checks: [
        { metric: "Unmatched Material Keys", actual: "18", expected: "0", status: "FAIL" },
        { metric: "Record Count", actual: "622", expected: "640", status: "WARNING" },
      ],
    },
    sla: { status: "FAIL", configuredMinutes: 20, actualMinutes: 7, varianceMinutes: null, criticality: "LOW" },
    recommendation: {
      action: "Auto-normalize material_id padding in the Gold Integration join and rerun",
      reason: "Unblocks today's Gold refresh without waiting on a coordinated fix across both upstream notebooks.",
      expectedOutcome: "Gold Integration completes with all 640 BE materials represented.",
      risk: "MEDIUM",
      confidencePct: 66,
    },
    approval: {
      requestedAt: "2026-09-15T03:15:00Z",
      decidedAt: "2026-09-15T03:20:00Z",
      decidedBy: "Data Steward (BE)",
      decision: "REJECTED",
      rejectionReason:
        "Auto-padding in the join layer would mask the real defect in 03_sales_manufacturing_transformation. Holding for a proper fix in the notebook rather than a downstream workaround.",
    },
    remediation: null,
    postValidation: null,
    audit: [
      { id: "a1", timestamp: "2026-09-15T03:11:38Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-15T03:11:50Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-15T03:14:20Z", label: "Investigation completed", actor: "ai", detail: "Root cause: material_id padding mismatch between silver tables." },
      { id: "a4", timestamp: "2026-09-15T03:14:20Z", label: "DQ validation completed", actor: "system", detail: null },
      { id: "a5", timestamp: "2026-09-15T03:14:20Z", label: "SLA validation completed", actor: "system", detail: null },
      { id: "a6", timestamp: "2026-09-15T03:15:00Z", label: "Recommendation generated", actor: "ai", detail: "Auto-normalize padding and rerun — 66% confidence." },
      { id: "a7", timestamp: "2026-09-15T03:20:00Z", label: "Human rejected recommendation", actor: "human", detail: "Held for a proper upstream fix instead of a join-layer workaround." },
    ],
  },

  // ---- Historical resolved incidents (trailing week) ----
  {
    incidentId: "INC-118C2AAE",
    pipelineRunId: "RUN-11223cba",
    pipelineId: "sales_processing",
    pipelineName: "Sales Processing",
    country: "CA",
    status: "RESOLVED",
    severity: "MEDIUM",
    detectedAt: "2026-09-14T02:09:00Z",
    assignee: "R. Kimura",
    failure: {
      errorCode: "SAP-4318",
      errorType: "DataError",
      errorMessage: "sap_sales_order_item extract for CA contained an unexpected drop in row volume.",
      target: "03_sales_manufacturing_transformation",
      runPageUrl: null,
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-14T02:12:00Z",
      rootCause: "Incomplete upstream SAP extract for CA, same signature as the recurring row-volume pattern.",
      confidencePct: 78,
      evidence: ["CA extract row count well below the rolling average.", "Matches a known recurring extract-timing issue."],
      impact: "Sales Processing output for CA understated until re-extracted.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Re-trigger the upstream SAP extract for CA and rerun.",
    },
    dq: { status: "COMPLETE", completedAt: "2026-09-14T02:12:00Z", checks: [{ metric: "Record Count", actual: "3,020", expected: "~ 7,600", status: "FAIL" }] },
    sla: { status: "PASS", configuredMinutes: 30, actualMinutes: 3, varianceMinutes: 27, criticality: "LOW" },
    recommendation: {
      action: "Re-trigger the upstream SAP extract for CA and rerun Sales Processing",
      reason: "Known fix pattern from a prior incident with the same signature.",
      expectedOutcome: "Sales Processing completes for CA with full row volume.",
      risk: "LOW",
      confidencePct: 85,
    },
    approval: { requestedAt: "2026-09-14T02:13:00Z", decidedAt: "2026-09-14T02:17:00Z", decidedBy: "R. Kimura", decision: "APPROVED", rejectionReason: null },
    remediation: { remediationRunId: "RUN-REM-118c2aae", originalRunId: "RUN-11223cba", startedAt: "2026-09-14T02:18:00Z", completedAt: "2026-09-14T02:30:00Z", status: "SUCCESS", error: null },
    postValidation: { dqStatus: "PASS", slaStatus: "PASS", overallStatus: "PASS" },
    audit: [
      { id: "a1", timestamp: "2026-09-14T02:08:41Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-14T02:09:00Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-14T02:12:00Z", label: "Investigation completed", actor: "ai", detail: null },
      { id: "a4", timestamp: "2026-09-14T02:13:00Z", label: "Recommendation generated", actor: "ai", detail: null },
      { id: "a5", timestamp: "2026-09-14T02:17:00Z", label: "Human approval received", actor: "human", detail: "Approved by R. Kimura." },
      { id: "a6", timestamp: "2026-09-14T02:18:00Z", label: "Remediation started", actor: "system", detail: null },
      { id: "a7", timestamp: "2026-09-14T02:30:00Z", label: "Remediation completed", actor: "system", detail: null },
      { id: "a8", timestamp: "2026-09-14T02:31:00Z", label: "Post-remediation validation passed", actor: "system", detail: null },
      { id: "a9", timestamp: "2026-09-14T02:31:05Z", label: "Incident resolved", actor: "system", detail: null },
    ],
  },
  {
    incidentId: "INC-44BFE120",
    pipelineRunId: "RUN-77bb0912",
    pipelineId: "material_master_processing",
    pipelineName: "Material Master Processing",
    country: "BE",
    status: "RESOLVED",
    severity: "HIGH",
    detectedAt: "2026-09-13T02:05:45Z",
    assignee: "L. Fontaine",
    failure: {
      errorCode: "SAP-4102",
      errorType: "DataError",
      errorMessage: "Schema mismatch on sap_material_master.",
      target: "01_standardize_material_master",
      runPageUrl: null,
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-13T02:08:30Z",
      rootCause: "Same additive-schema drift pattern from a new sap_material_master column.",
      confidencePct: 90,
      evidence: ["New column detected in sap_material_master.", "Matches the prior-week incident signature."],
      impact: "Material master sync delayed for BE.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Update schema mapping and rerun.",
    },
    dq: { status: "COMPLETE", completedAt: "2026-09-13T02:08:30Z", checks: [{ metric: "Record Count", actual: "0", expected: "> 0", status: "FAIL" }] },
    sla: { status: "FAIL", configuredMinutes: 20, actualMinutes: 5, varianceMinutes: null, criticality: "HIGH" },
    recommendation: {
      action: "Update schema mapping then rerun",
      reason: "Known fix pattern from a prior incident with the same signature.",
      expectedOutcome: "Standardization completes normally.",
      risk: "LOW",
      confidencePct: 90,
    },
    approval: { requestedAt: "2026-09-13T02:09:00Z", decidedAt: "2026-09-13T02:15:00Z", decidedBy: "L. Fontaine", decision: "APPROVED", rejectionReason: null },
    remediation: { remediationRunId: "RUN-REM-44bfe120", originalRunId: "RUN-77bb0912", startedAt: "2026-09-13T02:16:00Z", completedAt: "2026-09-13T02:29:00Z", status: "SUCCESS", error: null },
    postValidation: { dqStatus: "PASS", slaStatus: "PASS", overallStatus: "PASS" },
    audit: [
      { id: "a1", timestamp: "2026-09-13T02:05:31Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-13T02:05:45Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-13T02:08:30Z", label: "Investigation completed", actor: "ai", detail: null },
      { id: "a4", timestamp: "2026-09-13T02:09:00Z", label: "Recommendation generated", actor: "ai", detail: null },
      { id: "a5", timestamp: "2026-09-13T02:15:00Z", label: "Human approval received", actor: "human", detail: "Approved by L. Fontaine." },
      { id: "a6", timestamp: "2026-09-13T02:16:00Z", label: "Remediation started", actor: "system", detail: null },
      { id: "a7", timestamp: "2026-09-13T02:29:00Z", label: "Remediation completed", actor: "system", detail: null },
      { id: "a8", timestamp: "2026-09-13T02:30:00Z", label: "Post-remediation validation passed", actor: "system", detail: null },
      { id: "a9", timestamp: "2026-09-13T02:30:05Z", label: "Incident resolved", actor: "system", detail: null },
    ],
  },
  {
    incidentId: "INC-77A2F901",
    pipelineRunId: "RUN-c30dd402",
    pipelineId: "procurement_processing",
    pipelineName: "Procurement Processing",
    country: "BE",
    status: "RESOLVED",
    severity: "MEDIUM",
    detectedAt: "2026-09-12T02:19:25Z",
    assignee: "L. Fontaine",
    failure: {
      errorCode: "SAP-4215",
      errorType: "DataError",
      errorMessage: "Null purchase_price rows caused by missing currency codes.",
      target: "02_procurement_transformation",
      runPageUrl: null,
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-12T02:22:00Z",
      rootCause: "Vendor rows missing currency_code, same pattern as recurring vendor onboarding gaps.",
      confidencePct: 85,
      evidence: ["Null currency_code on a subset of BE vendor rows.", "Matches prior incident signature."],
      impact: "Procurement data for BE delayed.",
      transientOrSystemic: "SYSTEMIC",
      recommendedAction: "Default missing currency to EUR and rerun.",
    },
    dq: { status: "COMPLETE", completedAt: "2026-09-12T02:22:00Z", checks: [{ metric: "Record Count", actual: "0", expected: "> 0", status: "FAIL" }] },
    sla: { status: "FAIL", configuredMinutes: 25, actualMinutes: 4, varianceMinutes: null, criticality: "MEDIUM" },
    recommendation: {
      action: "Default missing currency_code to EUR and rerun",
      reason: "Same low-risk default that resolved this signature previously.",
      expectedOutcome: "Procurement processing completes for BE.",
      risk: "LOW",
      confidencePct: 86,
    },
    approval: { requestedAt: "2026-09-12T02:23:00Z", decidedAt: "2026-09-12T02:27:00Z", decidedBy: "L. Fontaine", decision: "APPROVED", rejectionReason: null },
    remediation: { remediationRunId: "RUN-REM-77a2f901", originalRunId: "RUN-c30dd402", startedAt: "2026-09-12T02:28:00Z", completedAt: "2026-09-12T02:40:00Z", status: "SUCCESS", error: null },
    postValidation: { dqStatus: "PASS", slaStatus: "PASS", overallStatus: "PASS" },
    audit: [
      { id: "a1", timestamp: "2026-09-12T02:19:11Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-12T02:19:25Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-12T02:22:00Z", label: "Investigation completed", actor: "ai", detail: null },
      { id: "a4", timestamp: "2026-09-12T02:23:00Z", label: "Recommendation generated", actor: "ai", detail: null },
      { id: "a5", timestamp: "2026-09-12T02:27:00Z", label: "Human approval received", actor: "human", detail: "Approved by L. Fontaine." },
      { id: "a6", timestamp: "2026-09-12T02:28:00Z", label: "Remediation started", actor: "system", detail: null },
      { id: "a7", timestamp: "2026-09-12T02:40:00Z", label: "Remediation completed", actor: "system", detail: null },
      { id: "a8", timestamp: "2026-09-12T02:41:00Z", label: "Post-remediation validation passed", actor: "system", detail: null },
      { id: "a9", timestamp: "2026-09-12T02:41:05Z", label: "Incident resolved", actor: "system", detail: null },
    ],
  },
  {
    incidentId: "INC-90DAC773",
    pipelineRunId: "RUN-3a54ee13",
    pipelineId: "gold_integration",
    pipelineName: "Gold Integration",
    country: "CA",
    status: "RESOLVED",
    severity: "MEDIUM",
    detectedAt: "2026-09-09T03:13:10Z",
    assignee: "R. Kimura",
    failure: {
      errorCode: "SAP-4401",
      errorType: "InfrastructureError",
      errorMessage: "Gold read started before procurement_silver finished writing.",
      target: "04_material_supply_sales_gold",
      runPageUrl: null,
    },
    investigation: {
      status: "COMPLETE",
      completedAt: "2026-09-09T03:15:30Z",
      rootCause: "Dependency trigger fired on job-start rather than job-commit, same as the recurring race condition.",
      confidencePct: 91,
      evidence: ["procurement_silver still writing when Gold Integration's read began.", "First occurrence of this exact signature for CA."],
      impact: "Gold Integration output for CA delayed by minutes.",
      transientOrSystemic: "TRANSIENT",
      recommendedAction: "Rerun Gold Integration for CA.",
    },
    dq: { status: "COMPLETE", completedAt: "2026-09-09T03:15:30Z", checks: [{ metric: "Record Count", actual: "N/A — partial read", expected: "> 0", status: "FAIL" }] },
    sla: { status: "FAIL", configuredMinutes: 20, actualMinutes: 8, varianceMinutes: null, criticality: "LOW" },
    recommendation: {
      action: "Rerun Gold Integration for CA",
      reason: "Root cause was a timing race, not a data or code defect.",
      expectedOutcome: "Gold Integration completes and refreshes for CA.",
      risk: "LOW",
      confidencePct: 93,
    },
    approval: { requestedAt: "2026-09-09T03:16:00Z", decidedAt: "2026-09-09T03:19:00Z", decidedBy: "R. Kimura", decision: "APPROVED", rejectionReason: null },
    remediation: { remediationRunId: "RUN-REM-90dac773", originalRunId: "RUN-3a54ee13", startedAt: "2026-09-09T03:20:00Z", completedAt: "2026-09-09T03:32:00Z", status: "SUCCESS", error: null },
    postValidation: { dqStatus: "PASS", slaStatus: "PASS", overallStatus: "PASS" },
    audit: [
      { id: "a1", timestamp: "2026-09-09T03:12:52Z", label: "Pipeline execution failed", actor: "system", detail: null },
      { id: "a2", timestamp: "2026-09-09T03:13:10Z", label: "Incident created", actor: "system", detail: null },
      { id: "a3", timestamp: "2026-09-09T03:15:30Z", label: "Investigation completed", actor: "ai", detail: null },
      { id: "a4", timestamp: "2026-09-09T03:16:00Z", label: "Recommendation generated", actor: "ai", detail: null },
      { id: "a5", timestamp: "2026-09-09T03:19:00Z", label: "Human approval received", actor: "human", detail: "Approved by R. Kimura." },
      { id: "a6", timestamp: "2026-09-09T03:20:00Z", label: "Remediation started", actor: "system", detail: null },
      { id: "a7", timestamp: "2026-09-09T03:32:00Z", label: "Remediation completed", actor: "system", detail: null },
      { id: "a8", timestamp: "2026-09-09T03:33:00Z", label: "Post-remediation validation passed", actor: "system", detail: null },
      { id: "a9", timestamp: "2026-09-09T03:33:05Z", label: "Incident resolved", actor: "system", detail: null },
    ],
  },
];

// The agent's methodology is the same across incidents — only its
// conclusion differs — so the process trail is a fixed, shared sequence.
const INVESTIGATION_PROCESS = [
  "Failure execution identified",
  "Error details analyzed",
  "Failure pattern evaluated",
  "Root cause inferred",
];
const DQ_PROCESS = [
  "Record count checked",
  "Null values checked",
  "Duplicate records checked",
  "Freshness evaluated",
];
const SLA_PROCESS = [
  "Pipeline SLA retrieved",
  "Execution duration calculated",
  "Duration compared against threshold",
];

export const MOCK_INCIDENTS: Incident[] = RAW_INCIDENTS.map((incident) => ({
  ...incident,
  investigation: incident.investigation
    ? { ...incident.investigation, processSteps: INVESTIGATION_PROCESS }
    : null,
  dq: incident.dq
    ? { ...incident.dq, processSteps: DQ_PROCESS, summary: summarizeDQ(incident.dq.checks) }
    : null,
  sla: incident.sla
    ? { ...incident.sla, processSteps: SLA_PROCESS, summary: summarizeSLA(incident.sla) }
    : null,
}));
