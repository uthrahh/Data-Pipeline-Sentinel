import type { Incident } from "@/types";

/**
 * Derives the ai-dataops-assistant-shaped status labels (approval_status /
 * remediation_status / validation_status) from this model's own nested
 * approval/remediation/postValidation fields, rather than storing them as
 * separate fields that could drift out of sync with those objects.
 */
export function approvalStatusLabel(incident: Incident): string {
  if (!incident.approval) return "NOT_REQUIRED";
  if (incident.approval.decision === "APPROVED") return "APPROVED";
  if (incident.approval.decision === "REJECTED") return "REJECTED";
  return "PENDING";
}

export function remediationStatusLabel(incident: Incident): string {
  if (!incident.remediation) return "NOT_STARTED";
  return incident.remediation.status;
}

export function validationStatusLabel(incident: Incident): string {
  if (!incident.postValidation) return "NOT_STARTED";
  return incident.postValidation.overallStatus;
}
