import type { CountryCode, Person, PipelineFamily } from "./catalog";
import type { FailureKey } from "./failureTypes";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IncidentStatus =
  | "WAITING_APPROVAL"
  | "REMEDIATING"
  | "FAILED"
  | "ESCALATION_REQUIRED"
  | "ESCALATED"
  | "RESOLVED"
  | "REJECTED";

export type ExecutionStatus = "SUCCESS" | "FAILED" | "TIMEDOUT";

export interface PipelineRun {
  date: string;
  pipelineId: string;
  pipeline: string;
  country: CountryCode;
  family: PipelineFamily;
  jobId: string;
  runId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  executionStatus: ExecutionStatus;
  detectedAt: string;
  incidentId: string | null;
  dqStatus: "PASS" | "FAIL" | "N/A";
  slaStatus: "SAFE" | "CRITICAL";
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  label: string;
  actor: "system" | "ai" | "human";
  detail: string | null;
}

export interface Incident {
  id: string;
  runId: string;
  pipelineId: string;
  pipeline: string;
  country: CountryCode;
  jobId: string;
  owner: Person;
  failureKey: FailureKey;
  detectedAt: string;
  date: string;
  status: IncidentStatus;
  severity: Severity;
  executionStatus: ExecutionStatus;
  durationMinutes: number;
  slaStatus: "SAFE" | "CRITICAL";
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  remediationRunId: string | null;
  remediationStartedAt: string | null;
  resolvedAt: string | null;
  emailSent: boolean;
  /** Whether the remediation attempt (automatic or approved) failed — drives the escalation path. */
  remediationFailed: boolean;
  /** What will happen if this incident is approved and remediated in the demo. */
  remediationOutcome: "SUCCESS" | "FAILED";
  audit: AuditEvent[];
}

export interface AppNotification {
  id: string;
  incidentId: string;
  kind: "Email" | "Escalation";
  subject: string;
  reason: string;
  recipient: Person;
  cc: string[];
  failureKey: FailureKey;
  pipeline: string;
  sentAt: string;
  sentBy: string;
  body: string;
  resolution: string[];
}
