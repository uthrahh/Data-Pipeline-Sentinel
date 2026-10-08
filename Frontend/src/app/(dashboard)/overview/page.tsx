"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Activity, AlertOctagon, ArrowRight, CheckCircle2, Siren, Timer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { FAILURE_BY_KEY } from "@/ops/failureTypes";
import { SLA_BASELINE_MINUTES, WORKSPACE_BY_ID, inWorkspace } from "@/ops/catalog";
import { isActive } from "@/ops/derive";
import { useOps } from "@/ops/store";
import { EXECUTION_STATUS_STYLES, INCIDENT_STATUS_STYLES, SEVERITY_STYLES, SLA_STYLES } from "@/ops/styles";
import { formatDate, formatDateTime, formatDuration, formatNumber, formatPercent } from "@/lib/utils";

export default function OverviewPage() {
  const { runs, incidents, workspace, today } = useOps();

  const view = useMemo(() => {
    const todayRuns = runs.filter((r) => r.date === today && inWorkspace(r.pipelineId, workspace));
    const failed = todayRuns.filter((r) => r.executionStatus !== "SUCCESS").length;
    const active = incidents.filter((i) => isActive(i) && inWorkspace(i.pipelineId, workspace));
    return {
      total: todayRuns.length,
      failed,
      successRate: todayRuns.length ? ((todayRuns.length - failed) / todayRuns.length) * 100 : 0,
      maxDuration: todayRuns.reduce((m, r) => Math.max(m, r.durationMinutes), 0),
      active: active.length,
      attention: [...active].sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1)).slice(0, 5),
      recent: [...todayRuns].sort((a, b) => (a.startTime < b.startTime ? 1 : -1)).slice(0, 5),
    };
  }, [runs, incidents, workspace, today]);

  const incidentById = useMemo(() => new Map(incidents.map((i) => [i.id, i])), [incidents]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Pipeline Overview" description={`${WORKSPACE_BY_ID[workspace].name} · ${formatDate(`${today}T00:00:00Z`)} (UTC)`} />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Total Pipeline Runs" value={formatNumber(view.total)} supportingText="runs today" icon={Activity} accent="accent" />
          <KpiCard label="Failed Pipeline Runs" value={formatNumber(view.failed)} deltaIsGood={false} supportingText="failures today" icon={AlertOctagon} accent="danger" />
          <KpiCard label="Pipeline Success Rate" value={formatPercent(view.successRate)} supportingText={`${view.total - view.failed} of ${view.total} runs succeeded`} icon={CheckCircle2} accent="success" />
          <KpiCard label="Max Pipeline Run Duration" value={formatDuration(view.maxDuration)} supportingText={`SLA baseline: ${SLA_BASELINE_MINUTES} min`} icon={Timer} accent="neutral" />
          <KpiCard label="Active Incidents" value={formatNumber(view.active)} supportingText="open, across all days" icon={Siren} accent="danger" />
        </div>

        <Card>
          <CardHeader
            title="Incidents Needing Attention"
            description="The 5 most recently created open incidents."
            action={
              <Link href="/incidents" className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700">
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {view.attention.length === 0 ? (
            <EmptyState title="No open incidents" description="Every pipeline failure has been remediated or resolved." />
          ) : (
            <ul className="divide-y divide-border">
              {view.attention.map((i) => (
                <li key={i.id}>
                  <Link href={`/incidents/${i.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface-subtle">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text-primary">{i.pipeline}</p>
                      <p className="mt-0.5 text-xs text-text-tertiary">
                        <span className="font-mono">{i.id}</span> · {FAILURE_BY_KEY[i.failureKey].label} · {formatDateTime(i.detectedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge style={SEVERITY_STYLES[i.severity]} />
                      <StatusBadge style={INCIDENT_STATUS_STYLES[i.status]} pulse={i.status === "REMEDIATING"} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent Pipeline Activity"
            description="The 5 most recent pipeline runs."
            action={
              <Link href="/pipelines" className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700">
                View all runs <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {view.recent.length === 0 ? (
            <EmptyState title="No pipeline runs" description="There are no runs today for the selected workspace." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    <th className="px-5 py-2.5">Pipeline</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Started</th>
                    <th className="px-4 py-2.5">Duration</th>
                    <th className="px-4 py-2.5">SLA</th>
                    <th className="px-4 py-2.5">Incident</th>
                  </tr>
                </thead>
                <tbody>
                  {view.recent.map((r) => (
                    <tr key={r.runId} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium text-text-primary">{r.pipeline}</td>
                      <td className="px-4 py-3">
                        <StatusBadge style={EXECUTION_STATUS_STYLES[r.executionStatus]} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(r.startTime)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDuration(r.durationMinutes)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge style={SLA_STYLES[r.slaStatus]} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px]">
                        {r.incidentId && incidentById.has(r.incidentId) ? (
                          <Link href={`/incidents/${r.incidentId}`} className="text-accent-600 hover:underline">
                            {r.incidentId}
                          </Link>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
