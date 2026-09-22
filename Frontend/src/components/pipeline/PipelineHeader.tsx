import type { PipelineExecution } from "@/types";
import { PipelineStatusBadge } from "@/components/dashboard/PipelineStatusBadge";
import { formatDateTime, formatDuration } from "@/lib/utils";
import { getJobForPipeline } from "@/config/sapPipelineConfig";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

export function PipelineHeader({ execution }: { execution: PipelineExecution }) {
  const job = getJobForPipeline(execution.pipelineId);
  const jobLabel = job?.label ?? execution.jobId;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-text-primary">{execution.pipelineName}</h2>
        <PipelineStatusBadge status={execution.status} size="md" />
        {execution.environment && (
          <span className="rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-secondary">
            {execution.environment}
          </span>
        )}
      </div>
      {jobLabel && <p className="mt-1 text-xs text-text-tertiary">{jobLabel}</p>}

      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-7">
        <Field label="Execution ID" value={<span className="font-mono text-xs">{execution.runId}</span>} />
        <Field label="Trigger" value={execution.trigger.name} />
        <Field label="Started" value={formatDateTime(execution.startTime)} />
        <Field label="Ended" value={formatDateTime(execution.endTime)} />
        <Field label="Duration" value={formatDuration(execution.durationMinutes)} />
      </div>
    </div>
  );
}
