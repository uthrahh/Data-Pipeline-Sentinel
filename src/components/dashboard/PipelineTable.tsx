"use client";

import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink } from "lucide-react";
import type { PipelineExecution, PipelineExecutionSortKey } from "@/types";
import { PipelineStatusBadge } from "./PipelineStatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableRowsSkeleton } from "@/components/common/LoadingState";
import { cn, formatDateTime, formatDuration } from "@/lib/utils";
import { getCountryLabel, getJobForPipeline } from "@/config/sapPipelineConfig";

interface Column {
  key: PipelineExecutionSortKey | null;
  label: string;
  className?: string;
}

const COLUMNS: Column[] = [
  { key: "status", label: "Status" },
  { key: null, label: "Job" },
  { key: "pipelineName", label: "Pipeline" },
  { key: null, label: "Country" },
  { key: null, label: "Trigger" },
  { key: "startTime", label: "Start Time" },
  { key: "endTime", label: "End Time" },
  { key: "durationMinutes", label: "Duration" },
  { key: null, label: "Execution ID" },
  { key: null, label: "Incident" },
];

interface PipelineTableProps {
  executions: PipelineExecution[];
  isLoading: boolean;
  error: string | null;
  sortKey: PipelineExecutionSortKey;
  sortDirection: "asc" | "desc";
  onSort: (key: PipelineExecutionSortKey) => void;
  onRetry?: () => void;
}

export function PipelineTable({
  executions,
  isLoading,
  error,
  sortKey,
  sortDirection,
  onSort,
  onRetry,
}: PipelineTableProps) {
  const router = useRouter();

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  if (!isLoading && executions.length === 0) {
    return (
      <EmptyState
        title="No pipeline executions found"
        description="Try adjusting your filters or search terms, or check back after the next scheduled run."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-surface-subtle">
            {COLUMNS.map((col) => (
              <th
                key={col.label}
                className={cn(
                  "whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary",
                  col.className,
                )}
              >
                {col.key ? (
                  <button
                    onClick={() => onSort(col.key!)}
                    className="flex items-center gap-1 transition-colors hover:text-text-secondary"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableRowsSkeleton rows={8} cols={COLUMNS.length} />
          ) : (
            executions.map((exec) => {
              const job = getJobForPipeline(exec.pipelineId);
              return (
                <tr
                  key={exec.runId}
                  tabIndex={0}
                  role="button"
                  onClick={() => router.push(`/pipelines/${exec.runId}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(`/pipelines/${exec.runId}`);
                  }}
                  className={cn(
                    "group cursor-pointer border-b border-border text-xs transition-colors last:border-0 hover:bg-surface-subtle focus-visible:bg-surface-subtle",
                    (exec.status === "FAILED" || exec.status === "TIMED_OUT") && "bg-danger-50/30",
                  )}
                >
                  <td className="px-4 py-3">
                    <PipelineStatusBadge status={exec.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{job?.label ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-text-primary">
                      {exec.pipelineName}
                      <ExternalLink className="size-3 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{getCountryLabel(exec.country)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{exec.trigger.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(exec.startTime)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(exec.endTime)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDuration(exec.durationMinutes)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-text-tertiary">{exec.runId}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {exec.incidentId ? (
                      <span className="font-mono text-[11px] font-medium text-accent-600">{exec.incidentId}</span>
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
