import { MOCK_INCIDENTS } from "@/data/mock/incidents";
import { apiClient } from "@/services/apiClient";
import { USE_LIVE_API } from "@/lib/liveMode";
import type {
  Approval,
  AuditEvent,
  Incident,
  IncidentFilters,
  IncidentStatus,
  Paginated,
  Remediation,
  RemediationRunStatus,
  Severity,
  SuggestedRemediation,
  SuggestedRemediationAction,
} from "@/types";

const SIMULATED_LATENCY_MS = 260;

/** Matches Backend/services/incidents_service.py::AUTO_REMEDIATION_ACTOR. */
const AUTO_REMEDIATION_ACTOR = "auto-remediation";

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeAuditEvent(label: string, actor: AuditEvent["actor"], detail: string | null = null): AuditEvent {
  return { id: `a-${Math.random().toString(36).slice(2, 9)}`, timestamp: nowIso(), label, actor, detail };
}

export interface IncidentService {
  getIncidents(filters?: IncidentFilters): Promise<Paginated<Incident>>;
  getIncident(incidentId: string): Promise<Incident | null>;
  getIncidentByRunId(runId: string): Promise<Incident | null>;
  approveIncident(incidentId: string, decidedBy: string): Promise<Incident>;
  rejectIncident(incidentId: string, decidedBy: string, reason: string): Promise<Incident>;
}

/**
 * Mock implementation, backed by an in-memory mutable store so approve/reject
 * actions persist for the session and drive a simulated remediation → validation
 * lifecycle via timers. A future `ApiIncidentService` would call:
 *   GET  /api/incidents
 *   GET  /api/incidents/{id}
 *   POST /api/incidents/{id}/approve
 *   POST /api/incidents/{id}/reject
 * and the incident would instead progress via backend job state + polling/SSE —
 * callers (hooks/components) would not change.
 */
class MockIncidentService implements IncidentService {
  private store: Map<string, Incident> = new Map(MOCK_INCIDENTS.map((i) => [i.incidentId, structuredClone(i)]));

  async getIncidents(filters: IncidentFilters = {}): Promise<Paginated<Incident>> {
    let items = Array.from(this.store.values());

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.pipelineName.toLowerCase().includes(q) ||
          i.incidentId.toLowerCase().includes(q) ||
          i.failure.errorMessage.toLowerCase().includes(q),
      );
    }
    if (filters.status && filters.status.length > 0) {
      items = items.filter((i) => filters.status!.includes(i.status));
    }
    if (filters.severity && filters.severity.length > 0) {
      items = items.filter((i) => filters.severity!.includes(i.severity));
    }
    if (filters.country && filters.country.length > 0) {
      items = items.filter((i) => i.country !== undefined && filters.country!.includes(i.country));
    }

    items.sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));

    return delay({ items, total: items.length, page: 1, pageSize: items.length || 1 });
  }

  async getIncident(incidentId: string): Promise<Incident | null> {
    const found = this.store.get(incidentId);
    return delay(found ? structuredClone(found) : null);
  }

  async getIncidentByRunId(runId: string): Promise<Incident | null> {
    const found = Array.from(this.store.values()).find((i) => i.pipelineRunId === runId);
    return delay(found ? structuredClone(found) : null);
  }

  async approveIncident(incidentId: string, decidedBy: string): Promise<Incident> {
    const incident = this.store.get(incidentId);
    if (!incident) throw new Error(`Incident ${incidentId} not found`);
    if (incident.status !== "WAITING_APPROVAL") {
      throw new Error(`Incident ${incidentId} is not awaiting approval`);
    }

    incident.approval = {
      requestedAt: incident.approval?.requestedAt ?? nowIso(),
      decidedAt: nowIso(),
      decidedBy,
      decision: "APPROVED",
      rejectionReason: null,
    };
    incident.status = "APPROVED";
    incident.audit.push(makeAuditEvent("Human approval received", "human", `Approved by ${decidedBy}.`));

    this.scheduleRemediationLifecycle(incidentId);

    return delay(structuredClone(incident), 500);
  }

  async rejectIncident(incidentId: string, decidedBy: string, reason: string): Promise<Incident> {
    const incident = this.store.get(incidentId);
    if (!incident) throw new Error(`Incident ${incidentId} not found`);
    if (incident.status !== "WAITING_APPROVAL") {
      throw new Error(`Incident ${incidentId} is not awaiting approval`);
    }

    incident.approval = {
      requestedAt: incident.approval?.requestedAt ?? nowIso(),
      decidedAt: nowIso(),
      decidedBy,
      decision: "REJECTED",
      rejectionReason: reason,
    };
    incident.status = "REJECTED";
    incident.audit.push(makeAuditEvent("Human rejected recommendation", "human", reason));

    return delay(structuredClone(incident), 500);
  }

  /**
   * Simulates the backend's remediation execution + post-remediation validation.
   * Purely a client-side timer chain for demo purposes — a real backend would
   * push these transitions via polling or a websocket instead.
   */
  private scheduleRemediationLifecycle(incidentId: string) {
    const remediationRunId = `RUN-REM-${Math.random().toString(16).slice(2, 10)}`;

    setTimeout(() => {
      const incident = this.store.get(incidentId);
      if (!incident) return;
      incident.status = "REMEDIATING";
      incident.remediation = {
        remediationRunId,
        originalRunId: incident.pipelineRunId,
        startedAt: nowIso(),
        completedAt: null,
        status: "RUNNING",
        error: null,
      };
      incident.audit.push(
        makeAuditEvent("Remediation started", "system", `Run ${remediationRunId} launched.`),
      );
    }, 1200);

    setTimeout(() => {
      const incident = this.store.get(incidentId);
      if (!incident || !incident.remediation) return;
      incident.remediation = { ...incident.remediation, completedAt: nowIso(), status: "SUCCESS" };
      incident.status = "VALIDATING";
      incident.audit.push(makeAuditEvent("Remediation job succeeded", "system", "Job completed without errors."));
      incident.audit.push(makeAuditEvent("Running post-remediation validation", "system", null));
    }, 4200);

    setTimeout(() => {
      const incident = this.store.get(incidentId);
      if (!incident) return;
      incident.postValidation = { dqStatus: "PASS", slaStatus: "PASS", overallStatus: "PASS" };
      incident.status = "RESOLVED";
      incident.audit.push(makeAuditEvent("Post-remediation DQ and SLA passed", "system", null));
      incident.audit.push(makeAuditEvent("Incident resolved", "system", null));
    }, 6600);
  }
}

/** Raw row shape returned by the sentinel-backend's incidents endpoints — see
 * services/incidents_service.py in that repo for exactly how these are derived. */
interface RawIncidentRow {
  incident_id: string;
  job_id: number;
  job_name: string | null;
  run_id: number;
  run_page_url: string | null;
  error_message: string | null;
  error_type: string | null;
  result_state: string | null;
  severity: string | null;
  detected_at: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  remediation_run_id: number | null;
  remediation_status: string | null;
  remediation_started_at: string | null;
  remediation_completed_at: string | null;
  updated_at: string;
  suggested_action: string | null;
  suggested_action_reason: string | null;
}

interface IncidentsListResponse {
  success: boolean;
  data: { incidents: RawIncidentRow[]; count: number };
}

interface IncidentDetailResponse {
  success: boolean;
  data: RawIncidentRow;
}

function mapApproval(row: RawIncidentRow): Approval {
  return {
    requestedAt: row.detected_at,
    decidedAt: row.approved_at,
    decidedBy: row.approved_by,
    decision: row.status === "REJECTED" ? "REJECTED" : row.approved_at ? "APPROVED" : null,
    rejectionReason: row.rejection_reason,
  };
}

function mapRemediation(row: RawIncidentRow): Remediation | null {
  if (!row.remediation_run_id) return null;
  const status = (row.remediation_status ?? "PENDING") as RemediationRunStatus;
  return {
    remediationRunId: String(row.remediation_run_id),
    originalRunId: String(row.run_id),
    startedAt: row.remediation_started_at ?? row.approved_at ?? row.detected_at,
    completedAt: row.remediation_completed_at,
    status,
    error: status === "FAILED" ? row.error_message : null,
  };
}

function mapAudit(row: RawIncidentRow): AuditEvent[] {
  const events: AuditEvent[] = [
    {
      id: `${row.incident_id}-detected`,
      timestamp: row.detected_at,
      label: "Failure detected",
      actor: "system",
      detail: row.error_message,
    },
  ];
  if (row.status === "REJECTED") {
    events.push({
      id: `${row.incident_id}-rejected`,
      timestamp: row.approved_at ?? row.updated_at,
      label: "Rejected",
      actor: "human",
      detail: row.rejection_reason ?? `Rejected by ${row.approved_by ?? "unknown"}.`,
    });
  } else if (row.approved_at) {
    const isAuto = row.approved_by === AUTO_REMEDIATION_ACTOR;
    events.push({
      id: `${row.incident_id}-approved`,
      timestamp: row.approved_at,
      label: isAuto ? "Auto-remediated" : "Approved",
      actor: isAuto ? "system" : "human",
      detail: isAuto
        ? "Sentinel remediated this automatically — no human approval needed."
        : `Approved by ${row.approved_by ?? "unknown"}.`,
    });
  }
  if (row.remediation_started_at) {
    events.push({
      id: `${row.incident_id}-remediation-started`,
      timestamp: row.remediation_started_at,
      label: "Remediation started",
      actor: "system",
      detail: `Job re-triggered (run ${row.remediation_run_id}).`,
    });
  }
  if (row.remediation_completed_at) {
    events.push({
      id: `${row.incident_id}-remediation-done`,
      timestamp: row.remediation_completed_at,
      label: row.status === "RESOLVED" ? "Remediation succeeded" : "Remediation failed",
      actor: "system",
      detail: row.status === "RESOLVED" ? "Rerun completed successfully." : row.error_message,
    });
  }
  return events;
}

function mapSuggestedRemediation(row: RawIncidentRow): SuggestedRemediation | null {
  if (!row.suggested_action) return null;
  return {
    action: row.suggested_action as SuggestedRemediationAction,
    reason: row.suggested_action_reason ?? "",
  };
}

function mapIncident(row: RawIncidentRow): Incident {
  return {
    incidentId: row.incident_id,
    pipelineRunId: String(row.run_id),
    pipelineId: String(row.job_id),
    pipelineName: row.job_name ?? `Job ${row.job_id}`,
    status: row.status as IncidentStatus,
    severity: (row.severity ?? "MEDIUM") as Severity,
    detectedAt: row.detected_at,
    assignee: null,
    failure: {
      errorCode: row.result_state ?? "UNKNOWN",
      errorType: (row.error_type as Incident["failure"]["errorType"]) ?? "SystemError",
      errorMessage: row.error_message ?? "No error message reported.",
      target: null,
      runPageUrl: row.run_page_url,
    },
    investigation: null,
    dq: null,
    sla: null,
    recommendation: null,
    suggestedRemediation: mapSuggestedRemediation(row),
    approval: mapApproval(row),
    remediation: mapRemediation(row),
    postValidation: null,
    audit: mapAudit(row),
  };
}

/**
 * Live implementation — calls the sentinel-backend's incidents endpoints.
 * No LLM investigation/DQ/SLA/recommendation narrative (see mapIncident):
 * an incident here is a real failed Databricks run, and remediation is a
 * real job rerun triggered via the Jobs API.
 */
class ApiIncidentService implements IncidentService {
  async getIncidents(filters: IncidentFilters = {}): Promise<Paginated<Incident>> {
    const res = await apiClient.get<IncidentsListResponse>("/api/incidents/history");
    let items = res.data.incidents.map(mapIncident);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.pipelineName.toLowerCase().includes(q) ||
          i.incidentId.toLowerCase().includes(q) ||
          i.failure.errorMessage.toLowerCase().includes(q),
      );
    }
    if (filters.status && filters.status.length > 0) {
      items = items.filter((i) => filters.status!.includes(i.status));
    }
    if (filters.severity && filters.severity.length > 0) {
      items = items.filter((i) => filters.severity!.includes(i.severity));
    }

    return { items, total: items.length, page: 1, pageSize: items.length || 1 };
  }

  async getIncident(incidentId: string): Promise<Incident | null> {
    try {
      const res = await apiClient.get<IncidentDetailResponse>(`/api/incidents/${incidentId}`);
      return mapIncident(res.data);
    } catch {
      return null;
    }
  }

  async getIncidentByRunId(runId: string): Promise<Incident | null> {
    try {
      const res = await apiClient.get<IncidentDetailResponse>(`/api/incidents/by-run/${runId}`);
      return mapIncident(res.data);
    } catch {
      return null;
    }
  }

  async approveIncident(incidentId: string, decidedBy: string): Promise<Incident> {
    const res = await apiClient.post<IncidentDetailResponse>(`/api/incidents/${incidentId}/approve`, {
      approved_by: decidedBy,
    });
    return mapIncident(res.data);
  }

  async rejectIncident(incidentId: string, decidedBy: string, reason: string): Promise<Incident> {
    const res = await apiClient.post<IncidentDetailResponse>(`/api/incidents/${incidentId}/reject`, {
      rejected_by: decidedBy,
      reason,
    });
    return mapIncident(res.data);
  }
}

export const incidentService: IncidentService = USE_LIVE_API ? new ApiIncidentService() : new MockIncidentService();
