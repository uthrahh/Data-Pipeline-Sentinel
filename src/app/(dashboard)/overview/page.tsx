"use client";

import { useMemo } from "react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useIncidents } from "@/hooks/useIncidents";
import { usePipelines } from "@/hooks/usePipelines";
import { PageHeader } from "@/components/common/PageHeader";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { IncidentQueueCard } from "@/components/dashboard/IncidentQueueCard";
import { RecentExecutionsCard } from "@/components/dashboard/RecentExecutionsCard";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardHeader } from "@/components/common/Card";
import { PipelineDependencyDiagram } from "@/components/pipeline/PipelineDependencyDiagram";
import { Workflow } from "lucide-react";
import type { PipelineId } from "@/types";

const ATTENTION_STATUSES = ["OPEN", "INVESTIGATING", "WAITING_APPROVAL", "REMEDIATION_FAILED", "VALIDATION_FAILED"] as const;

export default function OverviewPage() {
  const { data: metrics, isLoading: metricsLoading, error: metricsError, refresh } = useDashboardMetrics();
  const { data: attention } = useIncidents({ status: [...ATTENTION_STATUSES] });
  const { data: recent } = usePipelines({ sortKey: "startTime", sortDirection: "desc", pageSize: 6 });

  const attentionPipelineIds = useMemo(
    () => new Set(attention.items.map((i) => i.pipelineId)) as Set<PipelineId>,
    [attention.items],
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Pipeline Overview"
        description="Health of the SAP material, procurement, sales, and gold integration pipeline, across all countries, in UTC."
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {metricsError ? (
          <ErrorState description={metricsError} onRetry={refresh} />
        ) : (
          <KpiGrid metrics={metrics} isLoading={metricsLoading} />
        )}

        <Card>
          <CardHeader
            title="Pipeline Dependency"
            description="Job 1 feeds Job 2's two branches; both must succeed before Job 3 writes the gold table."
            icon={<Workflow className="size-4" />}
          />
          <PipelineDependencyDiagram attentionPipelineIds={attentionPipelineIds} />
        </Card>

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
