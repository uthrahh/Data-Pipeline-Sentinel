"use client";

import { useMemo } from "react";
import { usePipelines } from "@/hooks/usePipelines";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { LoadingState } from "@/components/common/LoadingState";
import { ExecutionTrendChart } from "@/components/analytics/ExecutionTrendChart";
import { HealthCalendar, type DayHealth } from "@/components/analytics/HealthCalendar";
import { BarChart3, CalendarDays } from "lucide-react";
import { getPipeline } from "@/config/sapPipelineConfig";

export default function AnalyticsPage() {
  const { data, isLoading } = usePipelines({ pageSize: 200, sortKey: "startTime", sortDirection: "asc" });

  const trend = useMemo(() => {
    const byDate = new Map<string, { success: number; failed: number }>();
    for (const e of data.items) {
      const date = e.startTime.slice(0, 10);
      const bucket = byDate.get(date) ?? { success: 0, failed: 0 };
      if (e.status === "SUCCESS") bucket.success += 1;
      else if (e.status === "FAILED" || e.status === "TIMED_OUT") bucket.failed += 1;
      byDate.set(date, bucket);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, counts]) => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        ...counts,
      }));
  }, [data.items]);

  const { pipelines, dates, statusOf } = useMemo(() => {
    const pipelineSet = new Set<string>();
    const dateSet = new Set<string>();
    const map = new Map<string, DayHealth>();

    for (const e of data.items) {
      const date = e.startTime.slice(0, 10);
      pipelineSet.add(e.pipelineId);
      dateSet.add(date);
      const key = `${e.pipelineId}__${date}`;
      const existing = map.get(key);
      const value: DayHealth =
        e.status === "FAILED" || e.status === "TIMED_OUT" ? "failed" : e.status === "PARTIAL" ? "partial" : "success";
      if (!existing || existing === "success") map.set(key, value);
      else if (existing === "partial" && value === "failed") map.set(key, value);
    }

    return {
      pipelines: Array.from(pipelineSet).sort(),
      dates: Array.from(dateSet).sort(),
      statusOf: (pipeline: string, date: string): DayHealth => map.get(`${pipeline}__${date}`) ?? "none",
    };
  }, [data.items]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Analytics" description="SAP pipeline execution trends and health over the trailing week." />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Card>
          <CardHeader title="Execution Volume" description="Successful vs. failed executions per day" icon={<BarChart3 className="size-4" />} />
          <CardBody>
            {isLoading ? <LoadingState className="py-12" /> : <ExecutionTrendChart data={trend} />}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pipeline Health Calendar" description="Daily outcome per pipeline, trailing week" icon={<CalendarDays className="size-4" />} />
          <CardBody className="px-0 py-4">
            {isLoading ? (
              <LoadingState className="py-12" />
            ) : (
              <HealthCalendar
                pipelines={pipelines}
                dates={dates}
                cellStatus={statusOf}
                pipelineLabel={(id) => getPipeline(id)?.label ?? id}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
