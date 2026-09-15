import { Activity, AlertOctagon, CheckCircle2, Gauge, Timer } from "lucide-react";
import type { DashboardMetrics } from "@/types";
import { KpiCard } from "./KpiCard";
import { KpiCardSkeleton } from "@/components/common/LoadingState";
import { formatDuration, formatNumber, formatPercent } from "@/lib/utils";

// Five cards, one row on desktop (lg+) — only stacks on tablet/mobile.
const GRID_CLASSES = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5";

export function KpiGrid({ metrics, isLoading }: { metrics: DashboardMetrics | null; isLoading: boolean }) {
  if (isLoading || !metrics) {
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={GRID_CLASSES}>
      <KpiCard
        label="Total Pipeline Executions"
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
        label="Pipeline Success Rate"
        value={formatPercent(metrics.successRatePct.value)}
        deltaPct={metrics.successRatePct.deltaPct}
        supportingText="rolling 24h"
        icon={CheckCircle2}
        accent="success"
      />
      <KpiCard
        label="Max Pipeline Run Duration"
        value={formatDuration(metrics.maxDurationMinutes)}
        supportingText="longest execution today"
        icon={Timer}
        accent="neutral"
      />
      <KpiCard
        label="Average Pipeline Run Duration"
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
