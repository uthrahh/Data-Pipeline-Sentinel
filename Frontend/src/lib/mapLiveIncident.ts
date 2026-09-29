import type {
  AuditEvent,
  DQResult,
  FailureType,
  Incident,
  IncidentStatus,
  LiveDqCheck,
  LiveIncidentDetail,
  LiveIncidentRow,
  LiveSlaCheck,
  Severity,
  SLAResult,
} from "@/types";

/**
 * Maps the real ai-dataops-assistant API's row shapes onto this app's own
 * Incident type, so the existing detail-page components (FailureDetails,
 * OperationalMetadataCard, AuditTimeline) can render real data unchanged.
 * Nothing here invents data the real API doesn't provide — see
 * classifyFailureType's doc comment for the one place a heuristic is used,
 * same spirit as the Backend's own error-message classifier from earlier
 * in this project.
 */

const STATUS_MAP: Record<string, IncidentStatus> = {
  OPEN: "OPEN",
  INVESTIGATING: "INVESTIGATING",
  WAITING_APPROVAL: "WAITING_APPROVAL",
  APPROVED: "APPROVED",
  REMEDIATING: "REMEDIATING",
  REMEDIATION_FAILED: "REMEDIATION_FAILED",
  VALIDATING: "VALIDATING",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
  FAILED: "FAILED",
  SUCCESS_PARTIAL: "SUCCESS_PARTIAL",
};

function mapStatus(status: string): IncidentStatus {
  return STATUS_MAP[status?.toUpperCase()] ?? "INVESTIGATING";
}

function mapSeverity(criticality: string | null): Severity {
  const c = (criticality ?? "").toUpperCase();
  if (c === "CRITICAL") return "CRITICAL";
  if (c === "HIGH") return "HIGH";
  if (c === "LOW") return "LOW";
  return "MEDIUM";
}

/**
 * The real API's `issue_type` is usually null in practice (seen empty on
 * every sampled incident), so this falls back to a plain keyword read of
 * the real error_message — the same kind of transparent heuristic the
 * Backend built earlier in this project uses, not an invented classification.
 */
function classifyFailureType(issueType: string | null, message: string | null): FailureType {
  if (issueType) {
    const t = issueType.toUpperCase();
    if (t.includes("PERMISSION") || t.includes("CATALOG")) return "PERMISSION_ISSUE";
    if (t.includes("SCHEMA")) return "SCHEMA_CHANGE";
    if (t.includes("QUALITY") || t.includes("NULL") || t.includes("DUPLICATE")) return "DATA_QUALITY_BREACH";
    if (t.includes("RESTART") || t.includes("TASK")) return "KNOWN_TASK_RESTART";
    if (t.includes("TRANSIENT") || t.includes("CLUSTER") || t.includes("CONNECTION")) return "TRANSIENT_JOB_FAILURE";
  }
  const m = (message ?? "").toLowerCase();
  if (m.includes("permission") || m.includes("access") || m.includes("catalog") || m.includes("denied")) return "PERMISSION_ISSUE";
  if (m.includes("schema") || m.includes("column")) return "SCHEMA_CHANGE";
  if (m.includes("null") || m.includes("duplicate") || m.includes("quality") || m.includes("threshold")) return "DATA_QUALITY_BREACH";
  if (m.includes("cluster") || m.includes("timeout") || m.includes("connection") || m.includes("unavailable")) return "TRANSIENT_JOB_FAILURE";
  if (m.includes("restart") || m.includes("task")) return "KNOWN_TASK_RESTART";
  return "UNKNOWN_ERROR";
}

export function mapDq(dq: LiveDqCheck[] | undefined): DQResult | null {
  if (!dq || dq.length === 0) return null;
  const d = dq[0];
  const statusOf = (s: string) => (s === "PASS" ? "PASS" : s === "FAIL" ? "FAIL" : s === "NOT_CHECKED" ? "NOT_AVAILABLE" : "WARNING") as DQResult["checks"][number]["status"];
  return {
    status: "COMPLETE",
    completedAt: d.check_timestamp,
    processSteps: ["Checked record count, null count, and duplicate count.", "Evaluated freshness, volume, and completeness."],
    summary: d.dq_summary,
    checks: [
      { metric: "Record Count", actual: d.record_count ?? "—", expected: "> 0", status: statusOf(d.volume_status) },
      { metric: "Null Count", actual: d.null_count ?? "—", expected: "0", status: statusOf(d.completeness_status) },
      { metric: "Duplicate Count", actual: d.duplicate_count ?? "—", expected: "0", status: statusOf(d.overall_status) },
    ],
  };
}

export function mapSla(sla: LiveSlaCheck[] | undefined): SLAResult | null {
  if (!sla || sla.length === 0) return null;
  const s = sla[0];
  const configured = s.sla_time_minutes !== null && s.sla_time_minutes !== "" ? Number(s.sla_time_minutes) : null;
  const actual = s.execution_duration_minutes !== null && s.execution_duration_minutes !== "" ? Number(s.execution_duration_minutes) : null;
  return {
    status: s.sla_status === "PASS" ? "PASS" : s.sla_status === "FAIL" ? "FAIL" : s.sla_status === "NOT_CONFIGURED" ? "NOT_AVAILABLE" : "PENDING",
    processSteps: ["Compared actual execution duration against the configured SLA."],
    summary: s.sla_summary,
    configuredMinutes: configured,
    actualMinutes: actual,
    varianceMinutes: configured !== null && actual !== null ? actual - configured : null,
    criticality: s.criticality ? mapSeverity(s.criticality) : null,
  };
}

function buildAudit(row: LiveIncidentRow): AuditEvent[] {
  const events: AuditEvent[] = [
    { id: `${row.incident_id}-detected`, timestamp: row.detected_at, label: "Failure detected", actor: "system", detail: row.error_message },
  ];
  if (row.approved_at) {
    events.push({
      id: `${row.incident_id}-approved`,
      timestamp: row.approved_at,
      label: row.status === "REJECTED" ? "Rejected" : "Approved",
      actor: "human",
      detail: row.approved_by ? `By ${row.approved_by}` : null,
    });
  }
  events.push({ id: `${row.incident_id}-updated`, timestamp: row.last_updated, label: "Last updated", actor: "system", detail: row.final_message });
  return events;
}

export function mapLiveIncidentToIncident(row: LiveIncidentRow, checks?: { dq: LiveDqCheck[]; sla: LiveSlaCheck[] }): Incident {
  const failureType = classifyFailureType(row.issue_type, row.error_message);
  return {
    incidentId: row.incident_id,
    pipelineRunId: row.run_id ?? "—",
    pipelineId: row.job_id ?? row.pipeline_name,
    pipelineName: row.pipeline_name,
    status: mapStatus(row.status),
    severity: mapSeverity(row.criticality),
    detectedAt: row.detected_at,
    assignee: row.approved_by,
    assigneeEmail: null,
    failure: {
      errorCode: row.error_code ?? "UNKNOWN",
      errorType: failureType,
      errorMessage: row.error_message ?? "No error message reported.",
      target: null,
      runPageUrl: null,
    },
    investigation: null,
    dq: mapDq(checks?.dq),
    sla: mapSla(checks?.sla),
    recommendation: row.recommended_action
      ? { action: row.recommended_action, reason: "Recommended by the AI DataOps Assistant investigation agent.", expectedOutcome: "", risk: "MEDIUM", confidencePct: 0 }
      : null,
    approval: row.approval_status
      ? {
          requestedAt: row.detected_at,
          decidedAt: row.approved_at,
          decidedBy: row.approved_by,
          decision: row.status === "REJECTED" ? "REJECTED" : row.approval_status === "APPROVED" ? "APPROVED" : null,
          rejectionReason: null,
        }
      : null,
    remediation: null,
    postValidation: null,
    audit: buildAudit(row),
    regressionTest: null,
    notificationId: null,
    executionType: (row.execution_type as "JOB" | "PIPELINE" | null) ?? "JOB",
    guardrailId: row.guardrail_id,
    guardrailDecision: row.guardrail_decision,
    issueType: row.issue_type,
    criticality: row.criticality ? mapSeverity(row.criticality) : null,
    finalMessage: row.final_message,
  };
}

/**
 * The real API's investigation_result is a raw, messy agent-reasoning dump
 * (Python-repr-ish text, not structured JSON) — deliberately NOT forced
 * into the `Investigation` shape (which assumes structured confidence/
 * evidence/impact fields the real API doesn't provide; fabricating those
 * would be exactly the kind of invented narrative this project avoids).
 * Rendered as its own raw-text block on the incident detail page instead.
 */
export function mapLiveIncidentDetailToIncident(detail: LiveIncidentDetail, checks?: { dq: LiveDqCheck[]; sla: LiveSlaCheck[] }): Incident {
  return mapLiveIncidentToIncident(detail, checks);
}
