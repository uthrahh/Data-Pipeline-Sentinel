import type { PipelineExecution } from "@/types";
import { PipelineStatusBadge } from "@/components/dashboard/PipelineStatusBadge";
import { formatDateTime, formatDuration } from "@/lib/utils";
import { REGION_LABELS } from "@/lib/constants";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

export function PipelineHeader({ execution }: { execution: PipelineExecution }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">{execution.pipelineName}</h2>
        <PipelineStatusBadge status={execution.status} size="md" />
        <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-secondary">
          {execution.environment}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Run ID" value={<span className="font-mono text-xs">{execution.runId}</span>} />
        <Field label="Trigger" value={execution.trigger.name} />
        <Field label="Started" value={formatDateTime(execution.startTime)} />
        <Field label="Ended" value={formatDateTime(execution.endTime)} />
        <Field label="Duration" value={formatDuration(execution.durationMinutes)} />
        <Field label="Region" value={REGION_LABELS[execution.region] ?? execution.region} />
      </div>
    </div>
  );
}
