import type { CheckStatus, PipelineExecutionStatus } from "@/types";

/** Maps the real API's raw overall_status/result_state strings onto this app's styled status keys — so no raw backend enum (e.g. "ACTION_REQUIRED", "INTERNAL_ERROR") is ever shown unstyled. */
export function normalizePipelineStatus(status: string | null | undefined): PipelineExecutionStatus {
  const s = (status ?? "").toUpperCase();
  if (s === "SUCCESS") return "SUCCESS";
  if (s === "RUNNING") return "RUNNING";
  if (s.includes("TIMEOUT") || s.includes("TIMED_OUT")) return "TIMED_OUT";
  if (s === "FAILED" || s.includes("ERROR") || s === "ACTION_REQUIRED" || s === "REMEDIATION_FAILED") return "FAILED";
  if (s === "APPROVED" || s === "REMEDIATING" || s === "RESOLVED" || s === "WAITING_APPROVAL") return "PARTIAL";
  return "UNKNOWN";
}

/** Maps the real API's DQ/SLA status strings (PASS/FAIL/N/A/NOT_CHECKED/...) onto this app's styled check-status keys. */
export function normalizeCheckStatus(status: string | null | undefined): CheckStatus {
  const s = (status ?? "").toUpperCase();
  if (s === "PASS") return "PASS";
  if (s === "FAIL") return "FAIL";
  if (s === "WARNING") return "WARNING";
  if (s === "PENDING" || s === "NOT_STARTED") return "PENDING";
  return "NOT_AVAILABLE";
}
