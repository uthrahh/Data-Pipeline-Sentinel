"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/services/apiClient";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { cn } from "@/lib/utils";

interface RawJob {
  job_id: number;
  name: string | null;
  status: string | null;
}

interface PipelinesListResponse {
  success: boolean;
  data: { pipelines: RawJob[]; count: number };
}

function statusDot(status: string | null) {
  if (status === "SUCCESS") return "bg-success-500";
  if (status === "FAILED" || status === "INTERNAL_ERROR") return "bg-danger-500";
  if (status === "NO_RUNS" || !status) return "bg-text-tertiary/40";
  return "bg-warning-500";
}

/**
 * Real Databricks jobs from GET /api/pipelines, shown as a flat status list.
 * Deliberately does NOT draw dependency arrows between jobs — the Jobs API
 * doesn't expose any lineage/dependency relationship between them, so
 * inventing one (the way the mock PipelineDependencyDiagram does for the
 * fictional SAP pipeline set) would be showing structure that isn't real.
 */
export function LiveJobsSummary() {
  const [jobs, setJobs] = useState<RawJob[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<PipelinesListResponse>("/api/pipelines")
      .then((res) => {
        if (!cancelled) setJobs(res.data.pipelines);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load Databricks jobs.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <ErrorState description={error} className="py-8" />;
  if (!jobs) return <LoadingState className="py-8" />;

  return (
    <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <div
          key={job.job_id}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-xs font-medium text-text-primary shadow-xs"
        >
          <span className={cn("size-1.5 shrink-0 rounded-full", statusDot(job.status))} />
          <span className="truncate">{job.name ?? `Job ${job.job_id}`}</span>
        </div>
      ))}
    </div>
  );
}
