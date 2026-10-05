"use client";

import { useMemo } from "react";
import { BarChart3, CalendarDays, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { ExecutionTrendChart } from "@/components/analytics/ExecutionTrendChart";
import { HealthCalendar, type DayHealth } from "@/components/analytics/HealthCalendar";
import { DAYS, PIPELINES, WORKSPACE_BY_ID, inWorkspace } from "@/ops/catalog";
import { FAILURE_BY_KEY, FAILURE_TYPES } from "@/ops/failureTypes";
import { useOps } from "@/ops/store";

export default function AnalyticsPage() {
  const { runs, incidents, workspace } = useOps();

  const scopedRuns = useMemo(() => runs.filter((r) => inWorkspace(r.pipelineId, workspace)), [runs, workspace]);
  const scopedIncidents = useMemo(() => incidents.filter((i) => inWorkspace(i.pipelineId, workspace)), [incidents, workspace]);

  const trend = useMemo(
    () =>
      DAYS.map((d) => {
        const day = scopedRuns.filter((r) => r.date === d);
        const failed = day.filter((r) => r.executionStatus !== "SUCCESS").length;
        return {
          date: new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
          success: day.length - failed,
          failed,
        };
      }),
    [scopedRuns],
  );

  const calendar = useMemo(() => {
    const map = new Map<string, DayHealth>();
    for (const r of scopedRuns) {
      const k = `${r.pipelineId}__${r.date}`;
      const value: DayHealth = r.executionStatus !== "SUCCESS" ? "failed" : r.slaStatus === "CRITICAL" ? "partial" : "success";
      const cur = map.get(k);
      if (!cur || cur === "success" || (cur === "partial" && value === "failed")) map.set(k, value);
    }
    return map;
  }, [scopedRuns]);

  const pipelines = PIPELINES.filter((p) => inWorkspace(p.id, workspace));

  const byType = useMemo(() => {
    const counts = FAILURE_TYPES.map((f) => ({ key: f.key, label: f.label, count: scopedIncidents.filter((i) => i.failureKey === f.key).length }));
    const max = Math.max(1, ...counts.map((c) => c.count));
    return counts.sort((a, b) => b.count - a.count).map((c) => ({ ...c, pct: (c.count / max) * 100 }));
  }, [scopedIncidents]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Analytics" description={`${WORKSPACE_BY_ID[workspace].name} — pipeline outcomes, SLA health and failure types over the last 7 days.`} />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Card>
          <CardHeader title="Execution volume" description="Successful vs. failed runs per day" icon={<BarChart3 className="size-4" />} />
          <CardBody>
            <ExecutionTrendChart data={trend} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Failure types" description="Incidents by failure type, last 7 days" icon={<ListChecks className="size-4" />} />
          <CardBody>
            <ul className="space-y-2.5">
              {byType.map((t) => (
                <li key={t.key} className="grid grid-cols-[11rem_1fr_2rem] items-center gap-3 text-xs">
                  <span className="truncate text-text-secondary">{FAILURE_BY_KEY[t.key].label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <span className="block h-full rounded-full bg-accent-500" style={{ width: `${t.pct}%` }} />
                  </span>
                  <span className="text-right font-medium text-text-primary">{t.count}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pipeline health calendar" description="Daily outcome per pipeline — amber means the run succeeded but breached the 15 min SLA" icon={<CalendarDays className="size-4" />} />
          <CardBody className="px-0 py-4">
            <HealthCalendar
              pipelines={pipelines.map((p) => p.id)}
              dates={[...DAYS]}
              cellStatus={(p, d) => calendar.get(`${p}__${d}`) ?? "none"}
              pipelineLabel={(id) => pipelines.find((p) => p.id === id)?.name ?? id}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
