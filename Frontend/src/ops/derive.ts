import { FAILURE_BY_KEY, guardrailId } from "./failureTypes";
import type { Incident, PipelineRun } from "./types";

export const ACTIVE_STATUSES = new Set(["WAITING_APPROVAL", "ESCALATED", "REMEDIATING"]);

export function isActive(i: Incident): boolean {
  return ACTIVE_STATUSES.has(i.status);
}

export function approvalStatus(i: Incident | undefined): string {
  if (!i) return "-";
  if (i.status === "WAITING_APPROVAL") return "PENDING";
  if (i.status === "ESCALATED") return "ESCALATED";
  if (i.status === "REJECTED") return "REJECTED";
  return "APPROVED";
}

export function remediationStatus(i: Incident | undefined): string {
  if (!i) return "-";
  if (i.status === "REMEDIATING") return "IN_PROGRESS";
  if (i.status === "RESOLVED") return "SUCCESS";
  if (i.status === "REJECTED") return "NOT_EXECUTED";
  return "NOT_STARTED";
}

export function validationStatus(i: Incident | undefined): string {
  if (!i) return "-";
  if (i.status === "REMEDIATING") return "IN_PROGRESS";
  if (i.status === "RESOLVED") return "PASSED";
  return "NOT_STARTED";
}

export function overallStatus(run: PipelineRun, i: Incident | undefined): string {
  if (run.executionStatus === "SUCCESS" || !i) return "SUCCESS";
  if (i.status === "WAITING_APPROVAL") return "ACTION_REQUIRED";
  return i.status;
}

export function guardrailDecision(i: Incident | undefined): string {
  if (!i) return "-";
  return FAILURE_BY_KEY[i.failureKey].autoRemediable ? "APPROVAL_REQUIRED" : "ESCALATION_REQUIRED";
}

export function guardrailOf(i: Incident | undefined): string {
  return i ? guardrailId(FAILURE_BY_KEY[i.failureKey]) : "-";
}

export function recommendationOf(i: Incident | undefined): string {
  return i ? FAILURE_BY_KEY[i.failureKey].recommendation : "-";
}
