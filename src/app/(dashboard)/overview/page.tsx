"use client";

import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useIncidents } from "@/hooks/useIncidents";
import { usePipelines } from "@/hooks/usePipelines";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { IncidentQueueCard } from "@/components/dashboard/IncidentQueueCard";
import { RecentExecutionsCard } from "@/components/dashboard/RecentExecutionsCard";
import { ErrorState } from "@/components/common/ErrorState";

const ATTENTION_STATUSES = ["OPEN", "INVESTIGATING", "WAITING_APPROVAL", "REMEDIATION_FAILED", "VALIDATION_FAILED"] as const;

export default function OverviewPage() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refresh } = useDashboardMetrics();
  const { data: attention } = useIncidents({ status: [...ATTENTION_STATUSES] });
  const { data: recent } = usePipelines({ sortKey: "startTime", sortDirection: "desc", pageSize: 6 });

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pipeline Overview"
        description="Consolidated pipeline health across all regions, in UTC."
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {metricsError ? (
          <ErrorState description={metricsError} onRetry={refresh} />
        ) : (
          <KpiGrid metrics={metrics} isLoading={metricsLoading} />
        )}

        <IncidentQueueCard
          title="Incidents Needing Attention"
          description="Open investigations, pending approvals, and failed remediations."
          incidents={attention.items}
          emptyTitle="No open incidents"
          emptyDescription="Every pipeline failure has been investigated, remediated, and resolved."
          viewAllHref="/incidents"
        />

        <RecentExecutionsCard executions={recent.items} />
      </div>
    </div>
  );
}
