import type { IncidentStatus } from "@/types";

export type StepState = "complete" | "current" | "failed" | "stopped" | "pending";

export interface LifecycleStep {
  key: string;
  label: string;
  state: StepState;
}

const STEP_ORDER = [
  "detected",
  "investigating",
  "dq_sla",
  "recommendation",
  "waiting_approval",
  "remediating",
  "validating",
  "resolved",
] as const;

const STEP_LABELS: Record<(typeof STEP_ORDER)[number], string> = {
  detected: "Detected",
  investigating: "Investigating",
  dq_sla: "DQ / SLA",
  recommendation: "Recommendation",
  waiting_approval: "Waiting Approval",
  remediating: "Remediating",
  validating: "Validating",
  resolved: "Resolved",
};

/**
 * Maps an incident's current status onto the fixed 8-step remediation
 * lifecycle, producing a per-step visual state (complete / current / failed /
 * stopped / pending) for the stepper.
 */
export function getLifecycleSteps(status: IncidentStatus): LifecycleStep[] {
  const reachedIndex: Record<IncidentStatus, number> = {
    OPEN: 1,
    INVESTIGATING: 3,
    WAITING_APPROVAL: 4,
    APPROVED: 5,
    REMEDIATING: 5,
    REMEDIATION_FAILED: 5,
    VALIDATING: 6,
    VALIDATION_FAILED: 6,
    RESOLVED: 7,
    REJECTED: 4,
  };

  const failedAt: Partial<Record<IncidentStatus, number>> = {
    REMEDIATION_FAILED: 5,
    VALIDATION_FAILED: 6,
  };

  const stoppedAt: Partial<Record<IncidentStatus, number>> = {
    REJECTED: 4,
  };

  const current = reachedIndex[status];
  const failIdx = failedAt[status];
  const stopIdx = stoppedAt[status];

  return STEP_ORDER.map((key, i) => {
    let state: StepState = "pending";
    if (failIdx !== undefined && i === failIdx) state = "failed";
    else if (stopIdx !== undefined && i === stopIdx) state = "stopped";
    else if (status === "RESOLVED" && i <= current) state = "complete";
    else if (i < current) state = "complete";
    else if (i === current && failIdx === undefined && stopIdx === undefined) state = "current";
    else state = "pending";

    return { key, label: STEP_LABELS[key], state };
  });
}
