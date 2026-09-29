/**
 * Row shapes returned by the separately-deployed `ai-dataops-assistant`
 * Databricks App's real API (see services/liveApiService.ts) — reading
 * ai_dataops_poc.dataops.{pipeline_run_history, agent_incidents,
 * agent_dq_results, agent_sla_results}. Every field here is exactly what
 * that API returns; nothing is fabricated. Distinct from this app's own
 * `Incident`/`PipelineSummary` types (which back the static demo fixtures).
 */

export interface LivePipelineOperation {
  pipeline: string;
  job_id: string | null;
  run_id: string | null;
  start_time: string | null;
  end_time: string | null;
  execution_status: string | null;
  trigger_type: string | null;
  run_type: string | null;
  detected_at: string | null;
  incident_id: string;
  incident_status: string;
  approval_status: string;
  remediation_status: string;
  dq_status: string;
  sla_status: string;
  validation_status: string;
  issue_type: string;
  criticality: string;
  guardrail_id: string;
  guardrail_decision: string;
  recommended_action: string;
  overall_status: string;
}

export interface LiveIncidentRow {
  incident_id: string;
  pipeline_name: string;
  execution_type: string | null;
  job_id: string | null;
  pipeline_id: string | null;
  run_id: string | null;
  detected_at: string;
  error_code: string | null;
  error_message: string | null;
  issue_type: string | null;
  criticality: string | null;
  guardrail_id: string | null;
  guardrail_decision: string | null;
  status: string;
  approval_status: string | null;
  approved_by: string | null;
  approved_at: string | null;
  remediation_status: string | null;
  remediation_run_id: string | null;
  validation_status: string | null;
  recommended_action: string | null;
  final_message: string | null;
  last_updated: string;
}

export interface LiveIncidentDetail extends LiveIncidentRow {
  /** Raw agent output — a Python-repr-ish string, not clean JSON. Shown as free text, never parsed as structured data. */
  investigation_result: string | null;
  dq_result: string | null;
  sla_result: string | null;
}

export interface LiveDqCheck {
  incident_id: string;
  pipeline_name: string;
  check_timestamp: string;
  record_count: string | null;
  null_count: string | null;
  duplicate_count: string | null;
  freshness_status: string;
  volume_status: string;
  completeness_status: string;
  overall_status: string;
  dq_summary: string;
}

export interface LiveSlaCheck {
  incident_id: string;
  pipeline_name: string;
  country: string;
  check_timestamp: string;
  sla_time_minutes: string | null;
  execution_duration_minutes: string | null;
  sla_status: string;
  criticality: string;
  sla_summary: string;
}

export interface LiveDashboard {
  pipeline_operations: { items: LivePipelineOperation[]; count: number };
  active_incidents: { items: LiveIncidentRow[]; count: number };
  incident_history: { items: LiveIncidentRow[]; count: number };
}
