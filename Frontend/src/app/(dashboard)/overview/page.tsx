"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Activity, AlertOctagon, CheckCircle2, Database, Gauge, HeartPulse, Timer } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { IncidentQueueCard } from "@/components/dashboard/IncidentQueueCard";
import { RecentExecutionsCard } from "@/components/dashboard/RecentExecutionsCard";
import { Card, CardHeader } from "@/components/common/Card";
import { OverviewSettingsPanel } from "@/components/dashboard/OverviewSettingsPanel";
import { usePipelines } from "@/hooks/usePipelines";
import { useAllIncidentsFromStore } from "@/lib/incidentStore";
import { useOverviewSettings } from "@/lib/overviewSettings";
import { buildPipelineSummaries } from "@/data/mock/pipelineSummaries";
import { computeOverviewKpis } from "@/lib/overviewMetrics";
import { formatDuration, formatNumber, formatPercent } from "@/lib/utils";

const ATTENTION_STATUSES = new Set(["OPEN", "INVESTIGATING", "WAITING_APPROVAL", "REMEDIATION_FAILED", "VALIDATION_FAILED"]);

export default function OverviewPage() {
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
          <KpiCard
            label="Failed Pipelines"
            value={formatNumber(kpis.failedPipelines)}
            deltaIsGood={false}
            supportingText={`of ${kpis.totalPipelines} total`}
            icon={AlertOctagon}
            accent="danger"
          />
          <KpiCard label="Pipeline Success Rate" value={formatPercent(kpis.successRatePct)} supportingText="based on successful pipelines" icon={CheckCircle2} accent="success" />
          <KpiCard label="Max Pipeline Run Duration" value={formatDuration(kpis.maxDurationMinutes)} supportingText="configurable ceiling" icon={Timer} accent="neutral" />
          <KpiCard label="Average Pipeline Run Duration" value={formatDuration(kpis.avgDurationMinutes)} supportingText="configurable baseline" icon={Gauge} accent="neutral" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader
              title="Pipeline Health Check-up"
              description="Health score and optimization status for every pipeline, based on runtime."
              icon={<HeartPulse className="size-4" />}
            />
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <p className="text-sm text-text-secondary">
                {pipelines.filter((p) => p.optimizationRequired).length} of {pipelines.length} pipelines currently flagged for optimization.
              </p>
              <Link
                href="/pipelines/health"
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-accent-500 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-accent-600"
              >
                Check Pipeline Health
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Data Quality Check-up"
              description="Row counts, load freshness, and DQ pass/fail for every table in ai_dataops_poc.sap_demo."
              icon={<Database className="size-4" />}
            />
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <p className="text-sm text-text-secondary">7 tables monitored in the sap_demo schema.</p>
              <Link
                href="/data-quality"
                className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-accent-500 px-4 text-sm font-medium text-white shadow-xs transition-colors hover:bg-accent-600"
              >
                Check Data Quality
              </Link>
            </div>
          </Card>
        </div>

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
