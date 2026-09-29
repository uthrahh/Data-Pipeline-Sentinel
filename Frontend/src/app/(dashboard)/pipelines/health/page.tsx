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
import { fetchPipelineOperations } from "@/services/liveApiService";
import { PIPELINE_STATUS_STYLES } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { LivePipelineOperation } from "@/types";

function healthColor(score: number): string {
  if (score >= 80) return "text-success-600";
  if (score >= 50) return "text-warning-600";
  return "text-danger-600";
}

function LivePipelineHealthPage() {
  const [ops, setOps] = useState<LivePipelineOperation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPipelineOperations()
      .then((data) => {
        if (!cancelled) setOps(data);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load live pipeline operations.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pipeline Health Check-up"
        description="Real pipeline runs from ai-dataops-assistant's /api/pipeline-operations (trailing 24 hours)."
        breadcrumbs={[{ label: "Overview", href: "/overview" }, { label: "Pipeline Health" }]}
      />

      <div className="p-4 sm:p-6">
        {error ? (
          <EmptyState title="Unable to load" description={error} />
        ) : ops === null ? (
          <LoadingState label="Loading pipeline operations…" className="py-16" />
        ) : ops.length === 0 ? (
          <EmptyState
            title="No pipeline runs in the last 24 hours"
            description="The real API's pipeline-operations endpoint only looks back 24 hours. Check the Incidents page for older activity."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Pipeline</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Status</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Start Time</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">DQ Status</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">SLA Status</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Incident</th>
                </tr>
              </thead>
              <tbody>
                {ops.map((op, i) => (
                  <tr key={`${op.pipeline}-${op.run_id}-${i}`} className="border-b border-border text-xs last:border-0">
                    <td className="px-4 py-3 font-medium text-text-primary">{op.pipeline}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-0.5 font-medium text-text-secondary">{op.overall_status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(op.start_time)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{op.dq_status}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{op.sla_status}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-accent-600">
                      {op.incident_id !== "-" ? <Link href={`/incidents/${op.incident_id}`} className="hover:underline">{op.incident_id}</Link> : "—"}
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
