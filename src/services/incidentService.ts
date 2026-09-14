import { MOCK_INCIDENTS } from "@/data/mock/incidents";
import type { AuditEvent, Incident, IncidentFilters, Paginated } from "@/types";

const SIMULATED_LATENCY_MS = 260;

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

export const incidentService: IncidentService = new MockIncidentService();
