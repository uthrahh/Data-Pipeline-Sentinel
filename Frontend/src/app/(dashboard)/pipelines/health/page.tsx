"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { useOverviewSettings } from "@/lib/overviewSettings";
import { buildPipelineSummaries } from "@/data/mock/pipelineSummaries";
import { USE_LIVE_API } from "@/lib/liveMode";
import { fetchIncidentHistory, fetchPipelineOperations } from "@/services/liveApiService";
import { PIPELINE_STATUS_STYLES, CHECK_STATUS_STYLES } from "@/lib/constants";
import { normalizeCheckStatus, normalizePipelineStatus } from "@/lib/liveStatus";
import { cn, formatDateTime } from "@/lib/utils";
import type { LiveIncidentRow, LivePipelineOperation } from "@/types";

function healthColor(score: number): string {
  if (score >= 80) return "text-success-600";
  if (score >= 50) return "text-warning-600";
  return "text-danger-600";
}

interface ExecutionRow {
  key: string;
  pipeline: string;
  runId: string | null;
  startTime: string | null;
  status: string;
  dqStatus: string | null;
  slaStatus: string | null;
  incidentId: string | null;
}

/** Combines the trailing-24h pipeline-operations feed with incident history (unbounded by time) so a run from before that window still shows up if it has a recorded incident — the most complete "latest executions" view the real API can support without a dedicated unwindowed runs endpoint. */
function mergeExecutions(ops: LivePipelineOperation[], history: LiveIncidentRow[]): ExecutionRow[] {
  const byRunId = new Map<string, ExecutionRow>();

  for (const op of ops) {
    const key = op.run_id ?? `${op.pipeline}-${op.start_time}`;
    byRunId.set(key, {
      key,
      pipeline: op.pipeline,
      runId: op.run_id,
      startTime: op.start_time,
      status: op.overall_status,
      dqStatus: op.dq_status,
      slaStatus: op.sla_status,
      incidentId: op.incident_id !== "-" ? op.incident_id : null,
    });
  }

  for (const row of history) {
    const key = row.run_id ?? row.incident_id;
    if (byRunId.has(key)) continue;
    byRunId.set(key, {
      key,
      pipeline: row.pipeline_name,
      runId: row.run_id,
      startTime: row.detected_at,
      status: row.status,
      dqStatus: null,
      slaStatus: null,
      incidentId: row.incident_id,
    });
  }

  return Array.from(byRunId.values()).sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""));
}

function LivePipelineHealthPage() {
  const [executions, setExecutions] = useState<ExecutionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPipelineOperations(), fetchIncidentHistory()])
      .then(([ops, history]) => {
        if (!cancelled) setExecutions(mergeExecutions(ops, history));
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load pipeline executions.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pipeline Executions"
        description="Status, data quality, and SLA results for the latest pipeline runs."
        breadcrumbs={[{ label: "Overview", href: "/overview" }, { label: "Pipeline Executions" }]}
      />

      <div className="p-4 sm:p-6">
        {error ? (
          <EmptyState title="Unable to load" description={error} />
        ) : executions === null ? (
          <LoadingState label="Loading pipeline executions…" className="py-16" />
        ) : executions.length === 0 ? (
          <EmptyState title="No pipeline executions yet" description="Pipeline runs will appear here as they happen." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Pipeline</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Status</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Start Time</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Data Quality</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">SLA</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Incident</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((row) => (
                  <tr key={row.key} className="border-b border-border text-xs last:border-0">
                    <td className="px-4 py-3 font-medium text-text-primary">{row.pipeline}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge style={PIPELINE_STATUS_STYLES[normalizePipelineStatus(row.status)]} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{row.startTime ? formatDateTime(row.startTime) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.dqStatus ? <StatusBadge style={CHECK_STATUS_STYLES[normalizeCheckStatus(row.dqStatus)]} /> : <span className="text-text-tertiary">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.slaStatus ? <StatusBadge style={CHECK_STATUS_STYLES[normalizeCheckStatus(row.slaStatus)]} /> : <span className="text-text-tertiary">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-accent-600">
                      {row.incidentId ? <Link href={`/incidents/${row.incidentId}`} className="hover:underline">{row.incidentId}</Link> : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MockPipelineHealthPage() {
  const router = useRouter();
  const { settings } = useOverviewSettings();
  const pipelines = useMemo(() => buildPipelineSummaries(settings), [settings]);
  const sorted = useMemo(() => [...pipelines].sort((a, b) => a.healthScore - b.healthScore), [pipelines]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pipeline Health Check-up"
        description="Health score and optimization status for every pipeline, based on runtime vs. the configured average/max baselines."
        breadcrumbs={[{ label: "Overview", href: "/overview" }, { label: "Pipeline Health" }]}
      />

      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-subtle">
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Pipeline Name</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Status</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Health Score</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Optimization Required</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr
                  key={p.id}
                  tabIndex={0}
                  role="button"
                  onClick={() => router.push(`/pipelines/health/${p.id}`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/pipelines/health/${p.id}`)}
                  className="group cursor-pointer border-b border-border text-xs transition-colors last:border-0 hover:bg-surface-subtle"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-text-primary">
                      {p.name}
                      <ExternalLink className="size-3 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge style={PIPELINE_STATUS_STYLES[p.status]} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={cn("font-semibold", healthColor(p.healthScore))}>{p.healthScore}</span>
                    <span className="text-text-tertiary"> / 100</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.optimizationRequired ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700 ring-1 ring-inset ring-warning-500/20">
                        Optimization required
                      </span>
                    ) : (
                      <span className="text-text-tertiary">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PipelineHealthPage() {
  return USE_LIVE_API ? <LivePipelineHealthPage /> : <MockPipelineHealthPage />;
}
