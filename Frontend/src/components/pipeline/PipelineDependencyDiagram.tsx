import { ArrowRight } from "lucide-react";
import type { PipelineId } from "@/types";
import { JOBS, PIPELINES } from "@/config/sapPipelineConfig";
import { cn } from "@/lib/utils";

interface PipelineDependencyDiagramProps {
  /** Pipeline ids with an open incident right now — rendered as needing attention. */
  attentionPipelineIds?: Set<PipelineId>;
}

function pipelinesForJob(jobId: string) {
  const job = JOBS.find((j) => j.id === jobId);
  return job ? PIPELINES.filter((p) => job.pipelineIds.includes(p.id)) : [];
}

function NodeBox({
  label,
  needsAttention,
  className,
}: {
  label: string;
  needsAttention?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-surface px-3.5 py-2.5 text-xs font-medium shadow-xs",
        needsAttention ? "border-danger-500/30 bg-danger-50 text-danger-700" : "border-border text-text-primary",
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", needsAttention ? "bg-danger-500" : "bg-success-500")} />
      {label}
    </div>
  );
}

/**
 * Renders the SAP pipeline ecosystem's dependency structure from
 * sapPipelineConfig — Job 1 feeds Job 2's two branches, both of which feed
 * Job 3, which writes the Gold Delta Table. Add a pipeline to a job in the
 * config and it appears here automatically.
 */
export function PipelineDependencyDiagram({ attentionPipelineIds }: PipelineDependencyDiagramProps) {
  const job1 = pipelinesForJob("job1_material_master");
  const job2 = pipelinesForJob("job2_procurement_sales");
  const job3 = pipelinesForJob("job3_gold_integration");
  const needsAttention = (id: PipelineId) => attentionPipelineIds?.has(id) ?? false;

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[720px] flex-col items-center gap-1.5 px-4 py-2">
        <p className="self-start text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Job 1 — Material Master Processing</p>
        {job1.map((p) => (
          <NodeBox key={p.id} label={p.label} needsAttention={needsAttention(p.id)} />
        ))}

        <ArrowRight className="my-1 size-4 rotate-90 text-text-tertiary" />

        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Job 2 — Procurement &amp; Sales Processing</p>
        <div className="flex items-center gap-6">
          {job2.map((p) => (
            <NodeBox key={p.id} label={p.label} needsAttention={needsAttention(p.id)} />
          ))}
        </div>

        <ArrowRight className="my-1 size-4 rotate-90 text-text-tertiary" />

        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Job 3 — Gold Integration</p>
        {job3.map((p) => (
          <NodeBox key={p.id} label={p.label} needsAttention={needsAttention(p.id)} />
        ))}

        <ArrowRight className="my-1 size-4 rotate-90 text-text-tertiary" />

        <div className="rounded-lg border border-accent-500/30 bg-accent-50 px-3.5 py-2.5 text-xs font-semibold text-accent-700">
          Gold Delta Table
        </div>
      </div>
    </div>
  );
}
