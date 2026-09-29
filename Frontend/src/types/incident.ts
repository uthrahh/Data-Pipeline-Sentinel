import type { CheckStatus, CountryCode, RiskLevel, Severity } from "./common";
import type { PipelineId } from "./pipeline";

/**
 * Incident lifecycle. Mirrors the backend state machine:
 * Detect -> Investigate -> DQ/SLA -> Recommend -> Approve -> Remediate -> Validate -> Resolve
 *
 * SUCCESS_PARTIAL: pipeline technically succeeded but DQ or SLA exceeded its
 * configured limit — optimization required, a Notification is generated.
 * FAILED: closed with no remediation (Schema Change / Unknown Error / a
 * Permission Issue or DQ Breach the user chose to notify rather than run) —
 * distinct from REMEDIATION_FAILED, which means a rerun/restart was
 * attempted and failed.
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
  | "REJECTED"
  | "SUCCESS_PARTIAL"
  | "FAILED";

/**
 * The six failure types the Investigation Agent classifies every incident
 * into. Each has a different auto-resolve/approval/notification workflow —
 * see lib/failureWorkflow.ts for the exact rules per type.
 */
export type FailureType =
  | "TRANSIENT_JOB_FAILURE"
  | "KNOWN_TASK_RESTART"
  | "SCHEMA_CHANGE"
  | "UNKNOWN_ERROR"
  | "DATA_QUALITY_BREACH"
  | "PERMISSION_ISSUE";

export interface IncidentFailure {
  errorCode: string;
  errorType: FailureType;
  errorMessage: string;
  target: string | null;
  runPageUrl: string | null;
}

/**
 * `processSteps` is the ordered trail of what the agent actually did to reach
 * its conclusion; the narrative fields (`rootCause` / `summary`) are what it
 * concluded. Rendering always keeps these two visually distinct — see
 * AnalysisSection in components/incident.
 */
export interface Investigation {
  status: "PENDING" | "COMPLETE";
  completedAt: string | null;
  processSteps: string[];
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
  processSteps: string[];
  summary: string;
  checks: DQCheckResult[];
}

export interface SLAResult {
  status: CheckStatus;
  processSteps: string[];
  summary: string;
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

export type SuggestedRemediationAction = "RETRY" | "ESCALATE";

/**
 * The backend's real (non-fabricated) suggestion for every live incident —
 * a plain error_type -> action rule, not an AI narrative. RETRY incidents are
 * auto-remediated immediately (see `approval.decidedBy === "auto-remediation"`);
 * ESCALATE incidents wait for a human. See Backend/services/incidents_service.py::_suggest_action.
 * Not sourced from live Databricks data on mock incidents — optional there.
 */
export interface SuggestedRemediation {
  action: SuggestedRemediationAction;
  reason: string;
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

/**
 * Shown on a RESOLVED (or otherwise investigated-to-completion) incident's
 * detail page and added to the CI/CD regression suite: proof that the
 * scenario that caused this incident is now covered by an automated check,
 * so a future deployment can't silently reintroduce it.
 */
export interface RegressionTestCase {
  testId: string;
  scenario: string;
  expectedBehavior: string;
  expectedClassification: string;
  expectedWorkflow: string;
  expectedRemediation: string;
  expectedFinalState: string;
  addedToCiCdAt: string;
}

export interface Incident {
  incidentId: string;
  pipelineRunId: string;
  pipelineId: PipelineId;
  pipelineName: string;
  /** Not sourced from live Databricks data — present only on mock incidents. */
  country?: CountryCode;
  status: IncidentStatus;
  severity: Severity;
  detectedAt: string;
  /** The pipeline owner responsible for this incident — who any generated notification is addressed to. */
  assignee: string | null;
  assigneeEmail: string | null;
  failure: IncidentFailure;
  investigation: Investigation | null;
  dq: DQResult | null;
  sla: SLAResult | null;
  recommendation: Recommendation | null;
  suggestedRemediation?: SuggestedRemediation | null;
  approval: Approval | null;
  remediation: Remediation | null;
  postValidation: PostValidation | null;
  audit: AuditEvent[];
  regressionTest: RegressionTestCase | null;
  notificationId: string | null;
}

export interface IncidentFilters {
  search?: string;
  status?: IncidentStatus[];
  severity?: Severity[];
  country?: CountryCode[];
}
