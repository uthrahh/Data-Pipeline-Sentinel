"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Bot, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { PIPELINE_BY_ID, WORKSPACE_BY_ID, inWorkspace } from "@/ops/catalog";
import { approvalStatus, guardrailDecision, guardrailOf, overallStatus, remediationStatus, validationStatus } from "@/ops/derive";
import { FAILURE_BY_KEY, FAILURE_TYPES, type FailureKey } from "@/ops/failureTypes";
import { DayCalendar } from "@/components/pipeline/DayCalendar";
import { useOps } from "@/ops/store";
import { DQ_STYLES, EXECUTION_STATUS_STYLES, INCIDENT_STATUS_STYLES, SLA_STYLES } from "@/ops/styles";
import type { Incident, PipelineRun } from "@/ops/types";
import { cn, formatDateTime, formatDuration } from "@/lib/utils";

type StatusFilter = "ALL" | "SUCCESS" | "FAILED";

interface Column {
  label: string;
  className?: string;
  render: (r: PipelineRun, i: Incident | undefined) => ReactNode;
}

const mono = (v: string) => <span className="font-mono text-[11px] text-text-secondary">{v}</span>;
const dash = <span className="text-text-tertiary">—</span>;

const COLUMNS: Column[] = [
  { label: "Pipeline", className: "sticky left-0 z-10 bg-surface", render: (r) => <span className="font-medium text-text-primary">{r.pipeline}</span> },
  { label: "Responsible Person", render: (r) => <span className="font-medium text-text-primary">{PIPELINE_BY_ID[r.pipelineId]?.owner.name ?? "—"}</span> },
  { label: "Job ID", render: (r) => mono(r.jobId) },
  { label: "Run ID", render: (r) => mono(r.runId) },
  { label: "Start Time", render: (r) => <span className="text-text-secondary">{formatDateTime(r.startTime)}</span> },
  { label: "End Time", render: (r) => <span className="text-text-secondary">{formatDateTime(r.endTime)}</span> },
  { label: "Duration", render: (r) => <span className="text-text-secondary">{formatDuration(r.durationMinutes)}</span> },
  { label: "Execution Status", render: (r) => <StatusBadge style={EXECUTION_STATUS_STYLES[r.executionStatus]} /> },
  { label: "Detected At", render: (r) => <span className="text-text-secondary">{formatDateTime(r.detectedAt)}</span> },
  {
    label: "Incident ID",
    render: (r, i) =>
      i ? (
        <Link href={`/incidents/${i.id}`} className="font-mono text-[11px] text-accent-600 hover:underline">
          {i.id}
        </Link>
      ) : (
        dash
      ),
  },
  { label: "Incident Status", render: (_, i) => (i ? <StatusBadge style={INCIDENT_STATUS_STYLES[i.status]} pulse={i.status === "REMEDIATING"} /> : dash) },
  {
    label: "Recommended Action",
    render: (_, i) => {
      if (!i) return dash;
      const def = FAILURE_BY_KEY[i.failureKey];
      return (
        <div className="min-w-56">
          {def.autoRun ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700 ring-1 ring-inset ring-success-500/20">
              <Bot className="size-3" />
              Auto Remediable
            </span>
          ) : (
            <p className="font-medium text-text-primary">{def.recommendationText}</p>
          )}
          <p className="mt-0.5 font-mono text-[10px] text-text-tertiary">{def.recommendation}</p>
        </div>
      );
    },
  },
  { label: "Approval Status", render: (_, i) => (i ? mono(approvalStatus(i)) : dash) },
  { label: "Remediation Status", render: (_, i) => (i ? mono(remediationStatus(i)) : dash) },
  { label: "DQ Status", render: (r) => <StatusBadge style={DQ_STYLES[r.dqStatus]} /> },
  { label: "SLA Status", render: (r) => <StatusBadge style={SLA_STYLES[r.slaStatus]} /> },
  { label: "Validation Status", render: (_, i) => (i ? mono(validationStatus(i)) : dash) },
  { label: "Issue Type", render: (_, i) => (i ? <span className="font-medium text-text-primary">{FAILURE_BY_KEY[i.failureKey].label}</span> : dash) },
  { label: "Criticality", render: (_, i) => (i ? mono(i.severity) : dash) },
  { label: "Guardrail ID", render: (_, i) => (i ? mono(guardrailOf(i)) : dash) },
  { label: "Guardrail Decision", render: (_, i) => (i ? mono(guardrailDecision(i)) : dash) },
  { label: "Overall Status", render: (r, i) => mono(overallStatus(r, i)) },
];

function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export default function PipelinesPage() {
  const { runs, incidents, workspace, days, today } = useOps();
  const [day, setDay] = useState<string>(today);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [failure, setFailure] = useState<FailureKey | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const incidentById = useMemo(() => new Map(incidents.map((i) => [i.id, i])), [incidents]);
  const scoped = useMemo(() => runs.filter((r) => inWorkspace(r.pipelineId, workspace)), [runs, workspace]);

  const perDay = useMemo(() => {
    const map = new Map<string, { total: number; failed: number }>();
    for (const r of scoped) {
      const b = map.get(r.date) ?? { total: 0, failed: 0 };
      b.total += 1;
      if (r.executionStatus !== "SUCCESS") b.failed += 1;
      map.set(r.date, b);
    }
    return map;
  }, [scoped]);

  const dayRuns = useMemo(() => scoped.filter((r) => r.date === day), [scoped, day]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dayRuns
      .filter((r) => (status === "ALL" ? true : status === "SUCCESS" ? r.executionStatus === "SUCCESS" : r.executionStatus !== "SUCCESS"))
      .filter((r) => (failure === "ALL" ? true : incidentById.get(r.incidentId ?? "")?.failureKey === failure))
      .filter((r) => !q || r.pipeline.toLowerCase().includes(q) || r.runId.includes(q) || (r.incidentId ?? "").toLowerCase().includes(q))
      .sort((a, b) => (a.startTime < b.startTime ? 1 : -1));
  }, [dayRuns, status, failure, query, incidentById]);

  // Demo ordering: lead with up to 2 resolved incidents, then up to 2 waiting for approval, then everything else by time.
  const ordered = useMemo(() => {
    const statusOf = (r: PipelineRun) => incidentById.get(r.incidentId ?? "")?.status;
    const resolved = rows.filter((r) => statusOf(r) === "RESOLVED").slice(0, 2);
    const waiting = rows.filter((r) => statusOf(r) === "WAITING_APPROVAL").slice(0, 2);
    const lead = new Set([...resolved, ...waiting]);
    return [...resolved, ...waiting, ...rows.filter((r) => !lead.has(r))];
  }, [rows, incidentById]);

  const stats = useMemo(() => {
    const failed = dayRuns.filter((r) => r.executionStatus !== "SUCCESS").length;
    return { total: dayRuns.length, failed, success: dayRuns.length - failed, critical: dayRuns.filter((r) => r.slaStatus === "CRITICAL").length };
  }, [dayRuns]);

  return (
    <div className="flex flex-col">
      <PageHeader title="Pipeline Runs" description={`${WORKSPACE_BY_ID[workspace].name} — every pipeline run for the last ${days.length} days, with its incident, SLA and remediation status.`} />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <DayCalendar days={days} today={today} selected={day} onSelect={setDay} summary={(d) => perDay.get(d)} />

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span>
              <strong className="text-text-primary">{stats.total}</strong> runs
            </span>
            <span>
              <strong className="text-success-600">{stats.success}</strong> success
            </span>
            <span>
              <strong className="text-danger-600">{stats.failed}</strong> failed
            </span>
            <span>
              <strong className="text-danger-600">{stats.critical}</strong> SLA critical
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border-strong text-xs font-medium">
              {(["ALL", "SUCCESS", "FAILED"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn("px-3 py-1.5 transition-colors", status === s ? "bg-navy-950 text-white" : "bg-surface text-text-secondary hover:bg-surface-muted")}
                >
                  {s === "ALL" ? "All" : s === "SUCCESS" ? "Success" : "Failed"}
                </button>
              ))}
            </div>
            <select
              value={failure}
              onChange={(e) => setFailure(e.target.value as FailureKey | "ALL")}
              aria-label="Filter by failure type"
              className="rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-xs text-text-secondary"
            >
              <option value="ALL">All failure types</option>
              {FAILURE_TYPES.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-2.5 py-1.5">
              <Search className="size-3.5 text-text-tertiary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pipeline, run or incident"
                aria-label="Search runs"
                className="w-52 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {rows.length === 0 ? (
            <EmptyState title="No runs match" description="Try a different day, status or failure type." />
          ) : (
            <div className="max-h-[calc(100dvh-340px)] min-h-64 overflow-auto">
              <table className="w-max min-w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-20">
                  <tr className="border-b border-border bg-surface-subtle">
                    {COLUMNS.map((c, idx) => (
                      <th
                        key={c.label}
                        className={cn(
                          "whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary",
                          idx === 0 && "sticky left-0 z-30 bg-surface-subtle",
                        )}
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordered.map((r) => {
                    const inc = r.incidentId ? incidentById.get(r.incidentId) : undefined;
                    return (
                      <tr key={r.runId} className="border-b border-border transition-colors last:border-0 hover:bg-surface-subtle">
                        {COLUMNS.map((c, idx) => (
                          <td key={c.label} className={cn("whitespace-nowrap px-4 py-3", idx === 0 && c.className)}>
                            {c.render(r, inc)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-[11px] text-text-tertiary">
          Showing {rows.length} of {stats.total} runs for {dayLabel(day)}. All times are in UTC.
        </p>
      </div>
    </div>
  );
}
