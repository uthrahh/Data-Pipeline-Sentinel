import { Activity, AlertOctagon, CheckCircle2, Gauge, Timer } from "lucide-react";
import type { DashboardMetrics } from "@/types";
import { KpiCard } from "./KpiCard";
import { KpiCardSkeleton } from "@/components/common/LoadingState";
import { formatDuration, formatNumber, formatPercent } from "@/lib/utils";

export function KpiGrid({ metrics, isLoading }: { metrics: DashboardMetrics | null; isLoading: boolean }) {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        label="Total Executions"
        value={formatNumber(metrics.totalExecutions.value)}
        deltaPct={metrics.totalExecutions.deltaPct}
        supportingText="vs. yesterday"
        icon={Activity}
        accent="accent"
        trendData={metrics.executionsTrend}
      />
      <KpiCard
        label="Failed Pipelines"
        value={formatNumber(metrics.failedPipelines.value)}
        deltaPct={metrics.failedPipelines.deltaPct}
        deltaIsGood={false}
        supportingText={`${metrics.failedRequiringAttention} requiring attention`}
        icon={AlertOctagon}
        accent="danger"
      />
      <KpiCard
        label="Success Rate"
        value={formatPercent(metrics.successRatePct.value)}
        deltaPct={metrics.successRatePct.deltaPct}
        supportingText="rolling 24h"
        icon={CheckCircle2}
        accent="success"
      />
      <KpiCard
        label="Max Run Duration"
        value={formatDuration(metrics.maxDurationMinutes)}
        supportingText="longest execution today"
        icon={Timer}
        accent="neutral"
      />
      <KpiCard
        label="Avg Run Duration"
        value={formatDuration(metrics.avgDurationMinutes.value)}
        deltaPct={metrics.avgDurationMinutes.deltaPct}
        deltaIsGood={false}
        supportingText="across all pipelines"
        icon={Gauge}
        accent="neutral"
      />
    </div>
  );
}
