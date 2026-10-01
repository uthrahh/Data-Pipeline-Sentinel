import { apiClient } from "@/services/apiClient";
import type {
  LiveActionResult,
  LiveChatReply,
  LiveDashboard,
  LiveDqCheck,
  LiveHealth,
  LiveIncidentDetail,
  LiveIncidentRow,
  LiveIncidentStatus,
  LivePipelineOperation,
  LiveSlaCheck,
} from "@/types";

/**
 * Calls to the separately-deployed `ai-dataops-assistant` Databricks App
 * (see app.yaml's DATABRICKS_APP_URL and
 * src/app/api/proxy/[...path]/route.ts for how the browser reaches it
 * without ever seeing a Databricks credential). Every function here maps
 * 1:1 to one of that app's real endpoints — approve/reject are POSTs with
 * real side effects (a real guardrail-gated Databricks job rerun), wired up
 * deliberately, not silently.
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

export async function fetchIncidentDq(incidentId: string): Promise<LiveDqCheck[]> {
  const res = await apiClient.get<{ success: boolean; data: LiveDqCheck[] }>(`/api/incidents/${incidentId}/dq`);
  return res.data;
}

export async function fetchIncidentSla(incidentId: string): Promise<LiveSlaCheck[]> {
  const res = await apiClient.get<{ success: boolean; data: LiveSlaCheck[] }>(`/api/incidents/${incidentId}/sla`);
  return res.data;
}

export async function fetchIncidentStatus(incidentId: string): Promise<LiveIncidentStatus> {
  const res = await apiClient.get<Envelope<LiveIncidentStatus>>(`/api/incidents/${incidentId}/status`);
  return res.data;
}

/** Records human approval and immediately starts the guardrail-gated remediation (a real Databricks job rerun). */
export async function approveIncident(incidentId: string, approvedBy: string): Promise<LiveActionResult> {
  return apiClient.post<LiveActionResult>(`/api/incidents/${incidentId}/approve`, { approved_by: approvedBy });
}

/** Records rejection. No Databricks job or pipeline is executed. */
export async function rejectIncident(incidentId: string, rejectedBy: string): Promise<LiveActionResult> {
  return apiClient.post<LiveActionResult>(`/api/incidents/${incidentId}/reject`, { rejected_by: rejectedBy });
}

export async function remediateIncident(incidentId: string): Promise<LiveActionResult> {
  return apiClient.post<LiveActionResult>(`/api/incidents/${incidentId}/remediate`);
}

export async function validateIncidentRemediation(incidentId: string): Promise<LiveActionResult> {
  const res = await apiClient.get<LiveActionResult>(`/api/incidents/${incidentId}/validate`);
  return res;
}

export async function fetchHealth(): Promise<LiveHealth> {
  return apiClient.get<LiveHealth>("/api/health");
}

/** Genie — the real multi-agent supervisor (investigation/SLA/DQ/action/Genie routing) behind this app's chat. */
export async function sendChatMessage(message: string): Promise<string> {
  const res = await apiClient.post<Envelope<LiveChatReply>>("/api/chat", { message });
  return res.data.message;
}
