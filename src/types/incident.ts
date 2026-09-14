import type { CheckStatus, RiskLevel, Severity } from "./common";

/**
 * Incident lifecycle. Mirrors the backend state machine:
 * Detect -> Investigate -> DQ/SLA -> Recommend -> Approve -> Remediate -> Validate -> Resolve
 */
export type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "WAITING_APPROVAL"
  | "APPROVED"
  | "REMEDIATING"
  | "REMEDIATION_FAILED"
  | "VALIDATING"
  | "VALIDATION_FAILED"
  | "RESOLVED"
  | "REJECTED";

export type FailureType = "UserError" | "SystemError" | "InfrastructureError" | "DataError";

export interface IncidentFailure {
  errorCode: string;
  errorType: FailureType;
  errorMessage: string;
  target: string | null;
  runPageUrl: string | null;
}

export interface Investigation {
  status: "PENDING" | "COMPLETE";
  completedAt: string | null;
  rootCause: string;
  confidencePct: number;
  evidence: string[];
  impact: string;
  transientOrSystemic: "TRANSIENT" | "SYSTEMIC";
  recommendedAction: string;
}

export interface DQCheckResult {
  metric: string;
  actual: string;
  expected: string;
  status: CheckStatus;
}

export interface DQResult {
  status: "PENDING" | "COMPLETE" | "NOT_AVAILABLE";
  completedAt: string | null;
  checks: DQCheckResult[];
}

export interface SLAResult {
  status: CheckStatus;
  configuredMinutes: number | null;
  actualMinutes: number | null;
  varianceMinutes: number | null;
  criticality: Severity | null;
}

export interface Recommendation {
  action: string;
  reason: string;
  expectedOutcome: string;
  risk: RiskLevel;
  confidencePct: number;
}

export type ApprovalDecision = "APPROVED" | "REJECTED";

export interface Approval {
  requestedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  decision: ApprovalDecision | null;
  rejectionReason: string | null;
}

export type RemediationRunStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";

export interface Remediation {
  remediationRunId: string;
  originalRunId: string;
  startedAt: string;
  completedAt: string | null;
  status: RemediationRunStatus;
  error: string | null;
}

export interface PostValidation {
  dqStatus: CheckStatus;
  slaStatus: CheckStatus;
  overallStatus: "PASS" | "FAIL" | "PENDING" | "NOT_AVAILABLE";
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  label: string;
  actor: "system" | "ai" | "human";
  detail: string | null;
}

export interface Incident {
  incidentId: string;
  pipelineRunId: string;
  pipelineId: string;
  pipelineName: string;
  status: IncidentStatus;
  severity: Severity;
  detectedAt: string;
  assignee: string | null;
  failure: IncidentFailure;
  investigation: Investigation | null;
  dq: DQResult | null;
  sla: SLAResult | null;
  recommendation: Recommendation | null;
  approval: Approval | null;
  remediation: Remediation | null;
  postValidation: PostValidation | null;
  audit: AuditEvent[];
}

export interface IncidentFilters {
  search?: string;
  status?: IncidentStatus[];
  severity?: Severity[];
}
