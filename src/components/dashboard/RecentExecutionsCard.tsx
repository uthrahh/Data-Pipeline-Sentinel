import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PipelineExecution } from "@/types";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDuration, formatTime } from "@/lib/utils";

export function RecentExecutionsCard({ executions }: { executions: PipelineExecution[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Recent Pipeline Executions</h3>
          <p className="mt-0.5 text-xs text-text-tertiary">Most recent runs across all regions, in UTC.</p>
        </div>
        <Link href="/pipelines" className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700">
          View all pipelines
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {executions.length === 0 ? (
        <EmptyState title="No executions yet" className="py-10" />
      ) : (
        <ul className="divide-y divide-border">
          {executions.map((exec) => (
            <li key={exec.runId}>
              <Link
                href={`/pipelines/${exec.runId}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle"
              >
                <PipelineStatusBadge status={exec.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{exec.pipelineName}</p>
                  <p className="mt-0.5 truncate text-xs text-text-tertiary">{exec.trigger.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-text-secondary">{formatTime(exec.startTime)}</p>
                  <p className="mt-0.5 text-[11px] text-text-tertiary">{formatDuration(exec.durationMinutes)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
