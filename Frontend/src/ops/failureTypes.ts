export type FailureKey =
  | "TRANSIENT_INFRASTRUCTURE"
  | "TEMPORARY_EXECUTION_FAILURE"
  | "SOURCE_FILE_UNAVAILABLE"
  | "DQ_FAILURE"
  | "REPEATED_FAILURE"
  | "UNKNOWN"
  | "SCHEMA_MISMATCH"
  | "PERMISSION_FAILURE"
  | "RESOURCE_EXHAUSTION"
  | "TIMEOUT_FAILURE"
  | "DEPENDENCY_FAILURE"
  | "SLA_BREACH"
  | "DATA_CORRUPTION"
  | "CONFIGURATION_FAILURE";

export type BaseSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface PlannedChange {
  label: string;
  current: string;
  recommended: string;
}

export interface FailureTypeDef {
  key: FailureKey;
  /** 1-based position in the scenario table. */
  index: number;
  label: string;
  recommendation: string;
  /** The recommended action in plain English. */
  recommendationText: string;
  /** Set when AI cannot perform the remediation itself — why a person is needed. */
  aiLimit?: string;
  remediationLabel: string;
  /** false = no safe automatic action exists; the only path is human escalation (email). */
  autoRemediable: boolean;
  /** true = the guardrail lets Sentinel run the remediation by itself (no approval, no button). */
  autoRun: boolean;
  baseSeverity: BaseSeverity;
  errorCode: string;
  errorMessage: string;
  executionStatus: "FAILED" | "TIMEDOUT";
  /** How long the failed run lasted before it stopped (minutes). */
  failMinutes: number;
  rootCause: string;
  investigation: string[];
  analysisSteps: string[];
  remediationSteps: string[];
  validation: string[];
  solution: string[];
  change?: PlannedChange;
  regression: { scenario: string; expectedBehavior: string; expectedWorkflow: string };
}

const WF = "Incident created → AI investigation → failure type identified";

export const FAILURE_TYPES: FailureTypeDef[] = [
  {
    key: "TRANSIENT_INFRASTRUCTURE",
    index: 1,
    label: "Transient Infrastructure",
    recommendation: "RERUN_PIPELINE",
    recommendationText: "Rerun the pipeline",
    remediationLabel: "Rerun",
    autoRemediable: true,
    autoRun: true,
    baseSeverity: "MEDIUM",
    errorCode: "CLUSTER_ERROR",
    errorMessage: "Cluster terminated unexpectedly: spot instance lost (INSTANCE_UNREACHABLE)",
    executionStatus: "FAILED",
    failMinutes: 6,
    rootCause: "The job cluster lost a spot instance mid-run. This is a one-off platform event, not a defect in the pipeline.",
    investigation: [
      "Driver logs show INSTANCE_UNREACHABLE for 1 of 4 workers at the time of failure.",
      "The previous 14 runs of {pipeline} all succeeded on the same cluster policy.",
      "No code, schema, or configuration change was deployed in the last 24 hours.",
      "Same infrastructure signature has been auto-recovered by a rerun 3 times in the last 30 days.",
    ],
    analysisSteps: ["Read run status and termination code", "Inspect cluster event log", "Compare against last 15 successful runs", "Check for recent deployments or config changes", "Match against known transient signatures"],
    remediationSteps: ["Guardrail check: transient infrastructure failures may be rerun automatically", "Trigger a new run of {pipeline} on a fresh cluster", "Monitor the run until completion", "Validate output row counts against the previous run"],
    validation: ["Rerun completed with result_state SUCCESS", "Output row count within 2% of the previous successful run"],
    solution: ["Open the failed run and check the cluster event log to confirm that the instance loss was a one-off.", "Rerun {pipeline} on a fresh cluster once the cluster pool is healthy.", "If it keeps failing, review the cluster policy and the spot-instance settings."],
    regression: {
      scenario: "Spot instance lost during a Material Master load",
      expectedBehavior: "Run is classified as transient and rerun automatically — no approval needed",
      expectedWorkflow: `${WF} → automatic rerun → validation → resolved`,
    },
  },
  {
    key: "TEMPORARY_EXECUTION_FAILURE",
    index: 2,
    label: "Temporary Execution Failure",
    recommendation: "RERUN_PIPELINE",
    recommendationText: "Rerun the pipeline",
    remediationLabel: "Rerun",
    autoRemediable: true,
    autoRun: true,
    baseSeverity: "MEDIUM",
    errorCode: "TEMPORARILY_UNAVAILABLE",
    errorMessage: "Task failed: Delta table read returned HTTP 503 (service temporarily unavailable)",
    executionStatus: "FAILED",
    failMinutes: 4,
    rootCause: "A dependent Databricks service returned a short-lived 503 while the task was reading a Delta table.",
    investigation: [
      "Task 'read_silver' failed with HTTP 503 after 2 internal retries.",
      "Workspace status page shows a 6-minute degradation window overlapping the run.",
      "No data or schema issue found in the source tables.",
    ],
    analysisSteps: ["Read task-level failure details", "Correlate with workspace service health", "Verify the source tables are readable now", "Confirm no data-dependent error pattern"],
    remediationSteps: ["Guardrail check: temporary execution failures may be rerun automatically", "Trigger a new run of {pipeline}", "Monitor until completion", "Validate task outputs"],
    validation: ["Rerun completed with result_state SUCCESS", "All 5 tasks finished without retries"],
    solution: ["Check the workspace service health page for the time of the failure.", "Rerun {pipeline} once the service is healthy.", "If the rerun fails again, open the task log and look for the failing Delta table read."],
    regression: {
      scenario: "Delta read returns HTTP 503 during a Procurement & Sales load",
      expectedBehavior: "Run is classified as temporary and rerun automatically — no approval needed",
      expectedWorkflow: `${WF} → automatic rerun → validation → resolved`,
    },
  },
  {
    key: "SOURCE_FILE_UNAVAILABLE",
    index: 3,
    label: "Source File Unavailable",
    recommendation: "WAIT_FOR_SOURCE",
    recommendationText: "Wait for the source file, then run the pipeline",
    remediationLabel: "Wait for source",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "MEDIUM",
    errorCode: "FILE_NOT_FOUND",
    errorMessage: "Source file /mnt/raw/sap/mara/MARA_DELTA.csv was not found at the scheduled load time",
    executionStatus: "FAILED",
    failMinutes: 2,
    rootCause: "The upstream SAP extract has not landed yet, so the ingestion task found nothing to load.",
    investigation: [
      "Landing folder /mnt/raw/sap/mara/ contains yesterday's extract only.",
      "The SAP extract job normally lands the file 20–40 minutes after the scheduled start.",
      "No schema or permission problem — the path is valid and readable.",
    ],
    analysisSteps: ["Read ingestion task error", "List the landing folder contents", "Compare with the usual file arrival window", "Confirm path and permissions are valid"],
    remediationSteps: ["Validate guardrail: waiting for source is non-destructive", "Poll the landing folder every 5 minutes (up to 60 min)", "Start {pipeline} as soon as the file arrives", "Validate loaded row counts"],
    validation: ["Source file detected in landing zone", "Pipeline run completed with result_state SUCCESS"],
    solution: ["Approve the wait — Sentinel polls for the file and starts the pipeline automatically.", "If the file does not arrive within 60 minutes, contact the SAP extract team."],
    regression: {
      scenario: "Daily SAP extract has not landed at load time",
      expectedBehavior: "Pipeline waits for the source file instead of failing repeatedly",
      expectedWorkflow: `${WF} → human approval → wait for source → run → validation`,
    },
  },
  {
    key: "DQ_FAILURE",
    index: 4,
    label: "Data Quality Failure",
    recommendation: "QUARANTINE_BAD_DATA",
    recommendationText: "Quarantine the bad records and continue with the clean data",
    remediationLabel: "Quarantine bad records",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "HIGH",
    errorCode: "DQ_THRESHOLD_BREACH",
    errorMessage: "Data quality gate failed: NULL ratio for VENDOR_ID is 12.4% (threshold 5%)",
    executionStatus: "FAILED",
    failMinutes: 12,
    rootCause: "A batch of vendor records arrived without VENDOR_ID, breaching the null-ratio threshold on the procurement table.",
    investigation: [
      "1,248 of 10,060 rows (12.4%) have a NULL VENDOR_ID — threshold is 5%.",
      "All bad rows come from a single source batch loaded at 02:10 UTC.",
      "Row count and freshness checks passed; only completeness failed.",
    ],
    analysisSteps: ["Read DQ gate result", "Profile the failing column", "Trace bad rows to a source batch", "Confirm remaining rows are clean"],
    remediationSteps: ["Validate guardrail: quarantine is reversible", "Move the 1,248 bad rows to the quarantine table", "Continue the pipeline with the clean rows", "Re-run the DQ gate"],
    validation: ["NULL ratio for VENDOR_ID is now 0%", "Quarantine table holds 1,248 rows for review"],
    solution: ["Approve quarantine — bad rows are isolated, clean data continues downstream.", "Ask the source team to correct and resend the 1,248 vendor records."],
    regression: {
      scenario: "Null ratio on a required key exceeds 5%",
      expectedBehavior: "Bad records are quarantined and clean data is published",
      expectedWorkflow: `${WF} → human approval → quarantine → DQ re-check`,
    },
  },
  {
    key: "REPEATED_FAILURE",
    index: 5,
    label: "Repeated Failure",
    recommendation: "ESCALATE_INCIDENT",
    recommendationText: "Stop retrying and escalate to the pipeline owner",
    aiLimit: "The pipeline keeps failing for different reasons, so another retry would not help. AI stops the retry loop and hands the problem to a person.",
    remediationLabel: "Stop retry loop / escalate",
    autoRemediable: false,
    autoRun: false,
    baseSeverity: "HIGH",
    errorCode: "REPEATED_FAILURE",
    errorMessage: "Pipeline failed 4 consecutive runs; automatic retries are exhausted",
    executionStatus: "FAILED",
    failMinutes: 9,
    rootCause: "The same pipeline has failed four runs in a row with different symptoms — retrying again would not help.",
    investigation: [
      "4 consecutive failures in the last 6 hours (3 different error codes).",
      "Reruns after each failure did not change the outcome.",
      "Guardrail blocks further automatic retries to avoid a retry storm.",
    ],
    analysisSteps: ["Pull the last 10 runs of the pipeline", "Compare error codes across failures", "Check retry history against the guardrail limit", "Decide whether automation is still safe"],
    remediationSteps: ["Stop the automatic retry loop", "Pause the pipeline schedule", "Escalate to the pipeline owner by email", "Wait for human investigation"],
    validation: ["Retry loop stopped — no further automatic runs scheduled", "Owner notified and incident marked ESCALATED"],
    solution: ["Do not rerun again. Review the last 4 failed runs and identify the common cause.", "Resume the schedule only after the cause is fixed."],
    regression: {
      scenario: "Four consecutive failures with no successful run in between",
      expectedBehavior: "Automatic retries stop and the incident is escalated to a human",
      expectedWorkflow: `${WF} → stop retry loop → email escalation`,
    },
  },
  {
    key: "UNKNOWN",
    index: 6,
    label: "Unknown",
    recommendation: "ESCALATE_INCIDENT",
    recommendationText: "Escalate to the pipeline owner for investigation",
    aiLimit: "This error does not match any known failure, so AI cannot choose a safe action. A person must investigate.",
    remediationLabel: "Human investigation",
    autoRemediable: false,
    autoRun: false,
    baseSeverity: "MEDIUM",
    errorCode: "UNKNOWN_ERROR",
    errorMessage: "Run terminated with an unclassified error: java.lang.IllegalStateException (no matching failure signature)",
    executionStatus: "FAILED",
    failMinutes: 11,
    rootCause: "The error does not match any known failure signature, so no safe automated action can be chosen.",
    investigation: [
      "Stack trace ends in an IllegalStateException inside a custom transformation.",
      "No similar error exists in the last 90 days of incident history.",
      "Source data, schema, permissions, and cluster health all look normal.",
    ],
    analysisSteps: ["Read the full stack trace", "Search incident history for the same signature", "Check data, schema, permission and cluster health", "Conclude that no safe automation exists"],
    remediationSteps: ["Do not run any automated action", "Attach logs and findings to the incident", "Email the pipeline owner for investigation"],
    validation: ["Owner notified with the full investigation summary", "Incident marked ESCALATED"],
    solution: ["Open the failed run and review the stack trace attached to this incident.", "Reply to this email with the root cause so it can be added as a known signature."],
    regression: {
      scenario: "Exception with no matching failure signature",
      expectedBehavior: "No automated action is taken and a human is notified",
      expectedWorkflow: `${WF} → email escalation → human investigation`,
    },
  },
  {
    key: "SCHEMA_MISMATCH",
    index: 7,
    label: "Schema Mismatch",
    recommendation: "REFRESH_SCHEMA",
    recommendationText: "Add the new column, refresh the schema, then rerun",
    remediationLabel: "Refresh schema",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "HIGH",
    errorCode: "SCHEMA_MISMATCH",
    errorMessage: "AnalysisException: cannot resolve column 'ZZ_PLANT_CATEGORY' — source schema has changed",
    executionStatus: "FAILED",
    failMinutes: 5,
    rootCause: "The SAP source added a new column that the target Delta table does not have yet.",
    investigation: [
      "Source extract has 14 columns; the target table has 13.",
      "The only difference is the new column ZZ_PLANT_CATEGORY (STRING).",
      "Change is additive — no existing column was renamed or removed.",
    ],
    analysisSteps: ["Read the AnalysisException", "Diff source and target schemas", "Classify the change as additive or breaking", "Check downstream consumers of the table"],
    remediationSteps: ["Validate guardrail: additive schema change is safe", "Run ALTER TABLE ... ADD COLUMNS ZZ_PLANT_CATEGORY STRING", "Refresh the table schema in Unity Catalog", "Rerun {pipeline}"],
    validation: ["Target table now has 14 columns", "Rerun completed with result_state SUCCESS"],
    change: { label: "Target schema", current: "13 columns", recommended: "14 columns (+ ZZ_PLANT_CATEGORY STRING)" },
    solution: ["Approve the schema refresh — the new column is added and the pipeline reruns.", "Confirm with downstream teams that the extra column is expected."],
    regression: {
      scenario: "New column appears in a source table",
      expectedBehavior: "Additive schema change is applied and the pipeline recovers",
      expectedWorkflow: `${WF} → human approval → refresh schema → rerun → validation`,
    },
  },
  {
    key: "PERMISSION_FAILURE",
    index: 8,
    label: "Permission Failure",
    recommendation: "REQUEST_ACCESS",
    recommendationText: "Grant the missing access, then rerun",
    remediationLabel: "Request/grant access",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "HIGH",
    errorCode: "PERMISSION_DENIED",
    errorMessage: "PERMISSION_DENIED: service principal lacks SELECT on ai_dataops_poc.sap_demo.sap_vendor_material",
    executionStatus: "FAILED",
    failMinutes: 3,
    rootCause: "The pipeline's service principal lost SELECT access to a Unity Catalog table it needs.",
    investigation: [
      "Unity Catalog audit log shows a denied SELECT for the pipeline service principal.",
      "The grant was removed during a catalog permission cleanup yesterday.",
      "The table itself is healthy and unchanged.",
    ],
    analysisSteps: ["Read the PERMISSION_DENIED error", "Query the Unity Catalog audit log", "Identify the missing privilege", "Find the data owner who can approve the grant"],
    remediationSteps: ["Validate guardrail: access requests need an approver", "Submit the access request / grant SELECT to the service principal", "Wait for grant confirmation", "Rerun {pipeline}"],
    validation: ["SELECT privilege visible on the table for the service principal", "Rerun completed with result_state SUCCESS"],
    change: { label: "Privilege", current: "No access", recommended: "SELECT on sap_vendor_material" },
    solution: ["Approve the access grant (or approve the request to the data owner).", "Confirm that the permission removal was not intentional."],
    regression: {
      scenario: "Service principal loses SELECT on a source table",
      expectedBehavior: "Missing privilege is identified and access is requested/granted",
      expectedWorkflow: `${WF} → human approval → grant access → rerun → validation`,
    },
  },
  {
    key: "RESOURCE_EXHAUSTION",
    index: 9,
    label: "Resource Exhaustion",
    recommendation: "RETRY_WITH_MORE_RESOURCES",
    recommendationText: "Increase the compute size, then rerun",
    remediationLabel: "Increase compute",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "HIGH",
    errorCode: "OUT_OF_MEMORY",
    errorMessage: "Executor lost due to memory exhaustion (java.lang.OutOfMemoryError: Java heap space)",
    executionStatus: "FAILED",
    failMinutes: 22,
    rootCause: "Data volume grew past what the current 2-worker cluster can hold in memory during the join stage.",
    investigation: [
      "Executors were lost 3 times with OutOfMemoryError during the shuffle join.",
      "Input volume is 38% higher than the 30-day average.",
      "Peak executor memory reached 96% before failure.",
    ],
    analysisSteps: ["Read executor loss events", "Inspect memory and shuffle metrics", "Compare input volume with the 30-day average", "Size a cluster that fits the new volume"],
    remediationSteps: ["Validate guardrail: compute increase is reversible", "Resize the job cluster to the recommended size", "Rerun {pipeline} on the larger cluster", "Restore the original size after a successful run"],
    validation: ["Rerun completed with result_state SUCCESS", "Peak executor memory below 70%"],
    change: { label: "Compute", current: "Standard_D4as_v5 / 2 workers", recommended: "Standard_D8as_v5 / 4 workers" },
    solution: ["Approve the larger cluster — the rerun uses 4 × Standard_D8as_v5 workers.", "Review whether the cluster size should be raised permanently."],
    regression: {
      scenario: "Executor lost to out-of-memory on a join-heavy load",
      expectedBehavior: "Compute is increased and the rerun succeeds",
      expectedWorkflow: `${WF} → human approval → resize compute → rerun → validation`,
    },
  },
  {
    key: "TIMEOUT_FAILURE",
    index: 10,
    label: "Timeout Failure",
    recommendation: "RETRY_WITH_EXTENDED_TIMEOUT",
    recommendationText: "Extend the timeout, then rerun",
    remediationLabel: "Increase timeout",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "MEDIUM",
    errorCode: "RUN_TIMED_OUT",
    errorMessage: "Run exceeded the configured timeout of 70 minutes and was terminated",
    executionStatus: "TIMEDOUT",
    failMinutes: 70,
    rootCause: "A long-running aggregation did not finish inside the configured job timeout.",
    investigation: [
      "The run was progressing normally — the last task was still writing when it was terminated.",
      "Runtime is 4× the 15-minute baseline because of a one-off data backfill.",
      "No errors in the task logs before the timeout.",
    ],
    analysisSteps: ["Read termination reason (TIMEDOUT)", "Check task progress at termination", "Compare runtime with the 15-minute baseline", "Estimate the time needed to finish"],
    remediationSteps: ["Validate guardrail: timeout increase is reversible", "Raise the job timeout from 70 to 120 minutes", "Rerun {pipeline}", "Restore the original timeout afterwards"],
    validation: ["Rerun completed within the extended timeout", "Job timeout restored to 70 minutes"],
    change: { label: "Job timeout", current: "70 min", recommended: "120 min" },
    solution: ["Approve the extended timeout for this rerun.", "If the runtime stays this high, review the backfill or the query plan."],
    regression: {
      scenario: "Run terminated by the job timeout",
      expectedBehavior: "Timeout is extended for a rerun and the run completes",
      expectedWorkflow: `${WF} → human approval → extend timeout → rerun → validation`,
    },
  },
  {
    key: "DEPENDENCY_FAILURE",
    index: 11,
    label: "Dependency Failure",
    recommendation: "WAIT_AND_RETRY",
    recommendationText: "Wait for the upstream pipeline, then rerun",
    remediationLabel: "Wait for dependency",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "MEDIUM",
    errorCode: "UPSTREAM_DEPENDENCY_FAILED",
    errorMessage: "Upstream dependency check failed: silver table was not refreshed before this run started",
    executionStatus: "FAILED",
    failMinutes: 3,
    rootCause: "The pipeline started before its upstream pipeline finished, so its input table was stale.",
    investigation: [
      "The upstream pipeline was still running when this run started.",
      "Upstream is expected to finish in about 12 minutes.",
      "This pipeline itself is healthy.",
    ],
    analysisSteps: ["Read the dependency check failure", "Look up the upstream pipeline status", "Estimate the upstream completion time", "Confirm no other blocker exists"],
    remediationSteps: ["Validate guardrail: waiting is non-destructive", "Wait until the upstream pipeline completes", "Start {pipeline} automatically", "Validate freshness of the input table"],
    validation: ["Upstream run completed with result_state SUCCESS", "Pipeline run completed with result_state SUCCESS"],
    solution: ["Approve wait-and-retry — the pipeline starts once the upstream finishes.", "Consider moving the schedule so it starts after its upstream."],
    regression: {
      scenario: "Pipeline starts before its upstream completes",
      expectedBehavior: "Pipeline waits for the dependency and then runs",
      expectedWorkflow: `${WF} → human approval → wait for dependency → run → validation`,
    },
  },
  {
    key: "SLA_BREACH",
    index: 12,
    label: "SLA Breach",
    recommendation: "PRIORITIZE_RERUN",
    recommendationText: "Rerun on the high-priority queue",
    remediationLabel: "Priority remediation",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "HIGH",
    errorCode: "SLA_BREACHED",
    errorMessage: "Run exceeded the 15-minute SLA baseline (actual 31 min) and was flagged critical",
    executionStatus: "FAILED",
    failMinutes: 31,
    rootCause: "The run took twice the 15-minute baseline because it waited for cluster capacity in a busy queue.",
    investigation: [
      "Queue wait before start was 14 minutes (normal: under 1 minute).",
      "Execution time itself was 17 minutes — close to the baseline.",
      "Downstream gold tables are late by 16 minutes.",
    ],
    analysisSteps: ["Compare runtime with the 15-minute SLA baseline", "Split queue time from execution time", "Identify downstream consumers at risk", "Choose a priority path to recover"],
    remediationSteps: ["Validate guardrail: priority runs are allowed for critical SLA", "Rerun {pipeline} on the high-priority queue", "Notify downstream consumers of the delay", "Validate the SLA on the new run"],
    validation: ["Priority rerun finished in under 15 minutes", "Downstream tables refreshed"],
    change: { label: "Run priority", current: "Normal queue", recommended: "High-priority queue" },
    solution: ["Approve the priority rerun to bring downstream tables back on time.", "Review cluster pool capacity if this repeats."],
    regression: {
      scenario: "Run exceeds the 15-minute average runtime SLA",
      expectedBehavior: "Run is flagged critical and re-run with priority",
      expectedWorkflow: `${WF} → SLA marked critical → human approval → priority rerun → validation`,
    },
  },
  {
    key: "DATA_CORRUPTION",
    index: 13,
    label: "Data Corruption",
    recommendation: "QUARANTINE_BAD_DATA",
    recommendationText: "Quarantine the corrupt files and reprocess the rest",
    remediationLabel: "Quarantine/reprocess",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "HIGH",
    errorCode: "CORRUPT_RECORD",
    errorMessage: "Malformed records detected: 3 Parquet files have an invalid footer",
    executionStatus: "FAILED",
    failMinutes: 14,
    rootCause: "Three source files were truncated during transfer and cannot be read.",
    investigation: [
      "3 of 214 files in the batch have an invalid Parquet footer.",
      "File sizes are ~40% smaller than their siblings — consistent with a truncated transfer.",
      "The remaining 211 files read correctly.",
    ],
    analysisSteps: ["Read the corrupt-record error", "Identify the unreadable files", "Compare file sizes and checksums", "Confirm the rest of the batch is intact"],
    remediationSteps: ["Validate guardrail: quarantine is reversible", "Move the 3 corrupt files to the quarantine location", "Reprocess the remaining 211 files", "Request a resend of the 3 files"],
    validation: ["Pipeline completed on the 211 valid files", "3 files held in quarantine for resend"],
    solution: ["Approve quarantine and reprocess — valid files are loaded now.", "Ask the source team to resend the 3 corrupted files."],
    regression: {
      scenario: "Truncated Parquet files in a source batch",
      expectedBehavior: "Corrupt files are quarantined and valid data is reprocessed",
      expectedWorkflow: `${WF} → human approval → quarantine → reprocess → validation`,
    },
  },
  {
    key: "CONFIGURATION_FAILURE",
    index: 14,
    label: "Configuration Failure",
    recommendation: "FIX_CONFIGURATION",
    recommendationText: "Correct the job configuration, then rerun",
    remediationLabel: "Correct configuration",
    autoRemediable: true,
    autoRun: false,
    baseSeverity: "MEDIUM",
    errorCode: "INVALID_PARAMETER",
    errorMessage: "Job parameter 'source_path' points to a location that does not exist: /mnt/raw/sap/legacy",
    executionStatus: "FAILED",
    failMinutes: 1,
    rootCause: "A job parameter still points at the retired legacy landing folder.",
    investigation: [
      "Parameter source_path was last changed 2 days ago to /mnt/raw/sap/legacy.",
      "The legacy folder was removed during the storage migration.",
      "The correct path /mnt/raw/sap/current exists and contains today's files.",
    ],
    analysisSteps: ["Read the invalid-parameter error", "Diff the job configuration against the last good run", "Verify the correct path exists", "Check no other parameter is affected"],
    remediationSteps: ["Validate guardrail: configuration revert is reversible", "Update source_path to /mnt/raw/sap/current", "Rerun {pipeline}", "Validate output row counts"],
    validation: ["Job configuration updated and saved", "Rerun completed with result_state SUCCESS"],
    change: { label: "source_path", current: "/mnt/raw/sap/legacy", recommended: "/mnt/raw/sap/current" },
    solution: ["Approve the configuration fix — the parameter is corrected and the job reruns.", "Update the deployment template so the old path is not reintroduced."],
    regression: {
      scenario: "Job parameter points at a path that no longer exists",
      expectedBehavior: "Parameter is corrected and the pipeline recovers",
      expectedWorkflow: `${WF} → human approval → correct configuration → rerun → validation`,
    },
  },
];

export const FAILURE_BY_KEY: Record<FailureKey, FailureTypeDef> = Object.fromEntries(FAILURE_TYPES.map((f) => [f.key, f])) as Record<FailureKey, FailureTypeDef>;

export function guardrailId(def: FailureTypeDef): string {
  return `GR-${String(def.index).padStart(3, "0")}`;
}
