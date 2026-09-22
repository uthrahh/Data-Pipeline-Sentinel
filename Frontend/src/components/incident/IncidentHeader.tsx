import Link from "next/link";
import type { Incident } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { INCIDENT_STATUS_STYLES, SEVERITY_STYLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { getCountryLabel, getJobForPipeline, getPipeline } from "@/config/sapPipelineConfig";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

/**
 * Grounds the incident in the SAP pipeline it belongs to: which job, which
 * country, which notebook, and which tables it reads from and writes to —
 * all resolved from sapPipelineConfig via `incident.pipelineId` so this
 * context is never duplicated into the incident record itself.
 */
export function IncidentHeader({ incident }: { incident: Incident }) {
  const job = getJobForPipeline(incident.pipelineId);
  const pipeline = getPipeline(incident.pipelineId);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-mono text-lg font-semibold tracking-tight text-text-primary">{incident.incidentId}</h2>
        <StatusBadge style={INCIDENT_STATUS_STYLES[incident.status]} size="md" pulse={incident.status === "REMEDIATING"} />
        <StatusBadge style={SEVERITY_STYLES[incident.severity]} size="md" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <Field
          label="Pipeline"
          value={
            <Link href={`/pipelines/${incident.pipelineRunId}`} className="text-accent-600 hover:text-accent-700">
              {incident.pipelineName}
            </Link>
          }
        />
        <Field label="Job" value={job?.label ?? "—"} />
        <Field label="Country" value={getCountryLabel(incident.country)} />
        <Field label="Execution ID" value={<span className="font-mono text-xs">{incident.pipelineRunId}</span>} />
        <Field label="Detected" value={formatDateTime(incident.detectedAt)} />
        <Field label="Assignee" value={incident.assignee ?? "Unassigned"} />
      </div>

      {pipeline && (
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Activity &amp; Lineage</p>
          <p className="font-mono text-xs text-text-secondary">{pipeline.notebook}</p>
          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="space-y-0.5">
              {pipeline.sourceTables.map((table) => (
                <p key={table} className="font-mono text-[11px] text-text-tertiary">
                  {table}
                </p>
              ))}
            </div>
            <span className="hidden text-text-tertiary sm:inline">→</span>
            <p className="font-mono text-[11px] font-medium text-accent-600">{pipeline.targetTable}</p>
          </div>
        </div>
      )}
    </div>
  );
}
