import { apiClient } from "@/services/apiClient";
import type { LiveDashboard, LiveDqCheck, LiveIncidentDetail, LiveIncidentRow, LivePipelineOperation, LiveSlaCheck } from "@/types";

/**
 * Real, read-only calls to the separately-deployed `ai-dataops-assistant`
 * Databricks App (see app.yaml's DATABRICKS_APP_URL and
 * src/app/api/proxy/[...path]/route.ts for how the browser reaches it
 * without ever seeing a Databricks credential). Deliberately GET-only:
 * approve/reject/remediate exist on that API too, but it's a
 * separate team's shared system — wiring up live writes to it needs an
 * explicit decision, not something to do silently while making reads live.
 */

interface Envelope<T> {
  success: boolean;
  data: T;
}

export async function fetchPipelineOperations(): Promise<LivePipelineOperation[]> {
  const res = await apiClient.get<Envelope<{ pipelines: LivePipelineOperation[]; count: number }>>("/api/pipeline-operations");
  return res.data.pipelines;
}

export async function fetchActiveIncidents(): Promise<LiveIncidentRow[]> {
  const res = await apiClient.get<Envelope<{ incidents: LiveIncidentRow[]; count: number }>>("/api/incidents/active");
  return res.data.incidents;
}

export async function fetchIncidentHistory(): Promise<LiveIncidentRow[]> {
  const res = await apiClient.get<Envelope<{ incidents: LiveIncidentRow[]; count: number }>>("/api/incidents/history");
  return res.data.incidents;
}

export async function fetchIncidentDetail(incidentId: string): Promise<LiveIncidentDetail | null> {
  try {
    const res = await apiClient.get<Envelope<LiveIncidentDetail>>(`/api/incidents/${incidentId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function fetchIncidentChecks(incidentId: string): Promise<{ dq: LiveDqCheck[]; sla: LiveSlaCheck[] }> {
  const res = await apiClient.get<{ success: boolean; data: { dq: LiveDqCheck[]; sla: LiveSlaCheck[] } }>(`/api/incidents/${incidentId}/checks`);
  return res.data;
}

/** One call: pipeline_operations + active_incidents + incident_history together — what the Overview page uses. */
export async function fetchDashboard(): Promise<LiveDashboard> {
  const res = await apiClient.get<Envelope<LiveDashboard>>("/api/dashboard");
  return res.data;
}
