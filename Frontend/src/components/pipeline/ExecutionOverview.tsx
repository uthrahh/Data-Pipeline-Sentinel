import type { PipelineExecution } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { formatDuration } from "@/lib/utils";
import { getJobForPipeline, getPipeline } from "@/config/sapPipelineConfig";
import { ListTree } from "lucide-react";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

/**
 * Technical/notebook-level detail belongs here, on the pipeline detail page —
 * not on the overview table, which stays business/operations friendly.
 */
export function ExecutionOverview({ execution }: { execution: PipelineExecution }) {
  const pipeline = getPipeline(execution.pipelineId);
  const job = getJobForPipeline(execution.pipelineId);

  return (
    <Card>
      <CardHeader title="Execution Overview" icon={<ListTree className="size-4" />} />
      <CardBody className="py-1">
        <Row label="Job" value={job?.label ?? "—"} />
        <Row label="Notebook" value={<span className="font-mono text-xs">{pipeline?.notebook ?? "—"}</span>} />
        <Row label="Trigger Type" value={execution.trigger.type} />
        <Row label="Owner" value={execution.owner ?? "Unassigned"} />
        <Row label="Configured SLA" value={execution.slaMinutes ? formatDuration(execution.slaMinutes) : "Not configured"} />
      </CardBody>

      {pipeline && (
        <CardBody className="border-t border-border">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Data Lineage</p>
          <div className="space-y-1.5">
            {pipeline.sourceTables.map((table) => (
              <p key={table} className="truncate font-mono text-[11px] text-text-secondary" title={table}>
                {table}
              </p>
            ))}
          </div>
          <div className="my-2 pl-1 text-text-tertiary">↓</div>
          <p className="truncate font-mono text-[11px] font-medium text-accent-600" title={pipeline.targetTable}>
            {pipeline.targetTable}
          </p>
        </CardBody>
      )}
    </Card>
  );
}
