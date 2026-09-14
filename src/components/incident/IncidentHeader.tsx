import Link from "next/link";
import type { Incident } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { INCIDENT_STATUS_STYLES, SEVERITY_STYLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

export function IncidentHeader({ incident }: { incident: Incident }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-mono text-lg font-semibold tracking-tight text-text-primary">{incident.incidentId}</h2>
        <StatusBadge style={INCIDENT_STATUS_STYLES[incident.status]} size="md" pulse={incident.status === "REMEDIATING"} />
        <StatusBadge style={SEVERITY_STYLES[incident.severity]} size="md" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Field
          label="Pipeline"
          value={
            <Link href={`/pipelines/${incident.pipelineRunId}`} className="text-accent-600 hover:text-accent-700">
              {incident.pipelineName}
            </Link>
          }
        />
        <Field label="Run ID" value={<span className="font-mono text-xs">{incident.pipelineRunId}</span>} />
        <Field label="Detected" value={formatDateTime(incident.detectedAt)} />
        <Field label="Assignee" value={incident.assignee ?? "Unassigned"} />
      </div>
    </div>
  );
}
