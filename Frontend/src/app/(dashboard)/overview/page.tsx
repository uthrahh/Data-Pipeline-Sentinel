"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Activity, AlertOctagon, CheckCircle2, Database, Gauge, HeartPulse, Timer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { KpiCardSkeleton } from "@/components/common/LoadingState";
import { IncidentQueueCard } from "@/components/dashboard/IncidentQueueCard";
import { RecentExecutionsCard } from "@/components/dashboard/RecentExecutionsCard";
import { Card, CardHeader } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { OverviewSettingsPanel } from "@/components/dashboard/OverviewSettingsPanel";
import { usePipelines } from "@/hooks/usePipelines";
import { useLiveDashboard } from "@/hooks/useLiveDashboard";
import { useAllIncidentsFromStore, useInitLiveIncidents } from "@/lib/incidentStore";
import { useOverviewSettings } from "@/lib/overviewSettings";
import { USE_LIVE_API } from "@/lib/liveMode";
import { buildPipelineSummaries } from "@/data/mock/pipelineSummaries";
import { computeOverviewKpis } from "@/lib/overviewMetrics";
import { computeLiveOverviewKpis } from "@/lib/liveOverviewMetrics";
import { PIPELINE_STATUS_STYLES } from "@/lib/constants";
import { normalizePipelineStatus } from "@/lib/liveStatus";
import { formatDateTime, formatDuration, formatNumber, formatPercent } from "@/lib/utils";

const ATTENTION_STATUSES = new Set(["OPEN", "INVESTIGATING", "WAITING_APPROVAL", "REMEDIATION_FAILED", "VALIDATION_FAILED"]);

function MockOverview() {
  const { settings, setSettings } = useOverviewSettings();
  const pipelines = useMemo(() => buildPipelineSummaries(settings), [settings]);
  const kpis = useMemo(() => computeOverviewKpis(pipelines), [pipelines]);
  const allIncidents = useAllIncidentsFromStore();
  const attentionIncidents = useMemo(() => allIncidents.filter((i) => ATTENTION_STATUSES.has(i.status)), [allIncidents]);
  const { data: recent } = usePipelines({ sortKey: "startTime", sortDirection: "desc", pageSize: 6 });

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pipeline Overview"
        description="Health of the SAP material master, procurement, and sales & manufacturing pipelines, across all 10 countries, in UTC."
        actions={<OverviewSettingsPanel settings={settings} onChange={setSettings} />}
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Total Pipelines" value={formatNumber(kpis.totalPipelines)} supportingText="10 countries × 3 pipelines" icon={Activity} accent="accent" />
          <KpiCard label="Failed Pipelines" value={formatNumber(kpis.failedPipelines)} deltaIsGood={false} supportingText={`of ${kpis.totalPipelines} total`} icon={AlertOctagon} accent="danger" />
          <KpiCard label="Pipeline Success Rate" value={formatPercent(kpis.successRatePct)} supportingText="based on successful pipelines" icon={CheckCircle2} accent="success" />
          <KpiCard label="Max Pipeline Run Duration" value={formatDuration(kpis.maxDurationMinutes)} supportingText="configurable ceiling" icon={Timer} accent="neutral" />
          <KpiCard label="Average Pipeline Run Duration" value={formatDuration(kpis.avgDurationMinutes)} supportingText="configurable baseline" icon={Gauge} accent="neutral" />
        </div>

        <OverviewBoxes optimizationText={`${pipelines.filter((p) => p.optimizationRequired).length} of ${pipelines.length} pipelines currently flagged for optimization.`} />

        <IncidentQueueCard
          title="Incidents Needing Attention"
          description="Open investigations, pending approvals, and failed remediations."
          incidents={attentionIncidents}
          emptyTitle="No open incidents"
          emptyDescription="Every pipeline failure has been investigated, remediated, and resolved."
          viewAllHref="/incidents"
        />

        <RecentExecutionsCard executions={recent.items} />
      </div>
    </div>
  );
}

function OverviewBoxes({ optimizationText }: { optimizationText: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card>
        <CardHeader title="Pipeline Health Check-up" description="Health score and optimization status for every pipeline, based on runtime." icon={<HeartPulse className="size-4" />} />
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <p className="text-sm text-text-secondary">{optimizationText}</p>
          <Link href="/pipelines/health" className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-accent-500 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-accent-600">
            Check Pipeline Health
          </Link>
        </div>
      </Card>

      <Card>
        <CardHeader title="Data Quality Check-up" description="Row counts, load freshness, and pass/fail checks across every monitored table." icon={<Database className="size-4" />} />
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <p className="text-sm text-text-secondary">7 tables monitored.</p>
          <Link href="/data-quality" className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-accent-500 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-accent-600">
            Check Data Quality
          </Link>
        </div>
      </Card>
    </div>
  );
}

function LiveOverview() {
  useInitLiveIncidents();
  const { data, isLoading, error } = useLiveDashboard();
  const allIncidents = useAllIncidentsFromStore();
  const attentionIncidents = useMemo(() => allIncidents.filter((i) => ATTENTION_STATUSES.has(i.status)), [allIncidents]);
  const kpis = useMemo(() => (data ? computeLiveOverviewKpis(data) : null), [data]);
  const recentOps = useMemo(() => [...(data?.pipeline_operations.items ?? [])].slice(0, 8), [data]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pipeline Overview"
        description="Health of your SAP pipelines, incidents, and data quality — at a glance."
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {error ? (
          <EmptyState title="Unable to load pipeline data" description={error} />
        ) : isLoading || !kpis ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard label="Pipelines Monitored" value={formatNumber(kpis.totalPipelines)} supportingText="distinct pipelines running" icon={Activity} accent="accent" />
            <KpiCard label="Failed Pipelines" value={formatNumber(kpis.failedPipelines)} deltaIsGood={false} supportingText="need attention" icon={AlertOctagon} accent="danger" />
            <KpiCard label="Pipeline Success Rate" value={kpis.totalRuns > 0 ? formatPercent(kpis.successRatePct) : "—"} supportingText={`${kpis.totalRuns} runs tracked`} icon={CheckCircle2} accent="success" />
            <KpiCard label="Max Pipeline Run Duration" value={formatDuration(kpis.maxDurationMinutes)} supportingText="longest run time" icon={Timer} accent="neutral" />
            <KpiCard label="Active Incidents" value={formatNumber(kpis.activeIncidents)} supportingText={`${kpis.historyIncidents} resolved to date`} icon={Gauge} accent="neutral" />
          </div>
        )}

        <OverviewBoxes optimizationText="Per-run data quality and SLA results are shown on each incident's detail page." />

        <IncidentQueueCard
          title="Incidents Needing Attention"
          description="Open investigations, pending approvals, and failed remediations."
          incidents={attentionIncidents}
          emptyTitle="No open incidents"
          emptyDescription="Nothing is currently waiting on approval or mid-remediation."
          viewAllHref="/incidents"
        />

        <Card>
          <CardHeader title="Recent Pipeline Activity" description="The most recent pipeline runs." />
          {recentOps.length === 0 ? (
            <EmptyState title="No recent pipeline activity" description="Check Incidents for the full execution history." className="py-8" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                    <th className="px-4 py-2.5">Pipeline</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Start</th>
                    <th className="px-4 py-2.5">Run ID</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOps.map((op) => (
                    <tr key={`${op.pipeline}-${op.run_id}`} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-text-primary">{op.pipeline}</td>
                      <td className="px-4 py-3">
                        <StatusBadge style={PIPELINE_STATUS_STYLES[normalizePipelineStatus(op.overall_status)]} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(op.start_time)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-text-tertiary">{op.run_id}</td>
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

export default function OverviewPage() {
  return USE_LIVE_API ? <LiveOverview /> : <MockOverview />;
}
