"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Play, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toneStyle } from "@/lib/constants";
import { DQ_CHECKS, VALIDATION_TABLES, runCheck, type CheckOutcome, type CheckResult, type ValidationTable } from "@/ops/validation";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

type CellState = CheckOutcome | "running";

const RESULT_STYLE = {
  PASS: toneStyle("Pass", "success"),
  WARNING: toneStyle("Warning", "warning"),
  FAIL: toneStyle("Fail", "danger"),
} as const;

const key = (table: string, index: number) => `${table}:${index}`;

function Section({
  title,
  description,
  tables,
  expanded,
  onToggle,
  results,
  onRun,
  onRunAll,
}: {
  title: string;
  description: string;
  tables: ValidationTable[];
  expanded: string | null;
  onToggle: (t: string) => void;
  results: Record<string, CellState>;
  onRun: (table: string, index: number) => void;
  onRunAll: (table: string) => void;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} icon={<ShieldCheck className="size-4" />} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
              <th className="px-5 py-2.5">Table</th>
              <th className="px-4 py-2.5">Layer</th>
              <th className="px-4 py-2.5">Rows</th>
              <th className="px-4 py-2.5">Columns</th>
              <th className="px-4 py-2.5">Last loaded</th>
              <th className="px-4 py-2.5">Load type</th>
              <th className="px-4 py-2.5">Checks run</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => {
              const open = expanded === t.tableName;
              const outcomes = DQ_CHECKS.map((c) => results[key(t.tableName, c.index)]).filter((r): r is CheckOutcome => typeof r === "object");
              const count = (r: CheckResult) => outcomes.filter((o) => o.result === r).length;
              const anyRunning = DQ_CHECKS.some((c) => results[key(t.tableName, c.index)] === "running");
              return (
                <Fragment key={t.fqName}>
                  <tr className={cn("border-b border-border transition-colors", open ? "bg-surface-subtle" : "hover:bg-surface-subtle")}>
                    <td className="px-5 py-3">
                      <button onClick={() => onToggle(t.tableName)} aria-expanded={open} className="flex items-center gap-2 text-left">
                        <ChevronRight className={cn("size-4 shrink-0 text-text-tertiary transition-transform", open && "rotate-90")} />
                        <span>
                          <span className="block text-sm font-medium text-text-primary">{t.tableName}</span>
                          <span className="block font-mono text-[10px] text-text-tertiary">{t.fqName}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{t.layer}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatNumber(t.rowCount)}</td>
                    <td className="px-4 py-3 text-text-secondary">{t.columnCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(t.lastLoadedAt)}</td>
                    <td className="px-4 py-3 text-text-secondary">{t.loadType}</td>
                    <td className="px-4 py-3">
                      {outcomes.length === 0 && !anyRunning ? (
                        <span className="text-text-tertiary">Not tested</span>
                      ) : (
                        <span className="flex flex-wrap items-center gap-1.5">
                          <span className="text-text-secondary">{outcomes.length}/10</span>
                          {count("PASS") > 0 && <span className="rounded bg-success-50 px-1.5 py-0.5 font-semibold text-success-700">{count("PASS")} pass</span>}
                          {count("WARNING") > 0 && <span className="rounded bg-warning-50 px-1.5 py-0.5 font-semibold text-warning-700">{count("WARNING")} warn</span>}
                          {count("FAIL") > 0 && <span className="rounded bg-danger-50 px-1.5 py-0.5 font-semibold text-danger-700">{count("FAIL")} fail</span>}
                          {anyRunning && <Loader2 className="size-3.5 animate-spin text-accent-500" />}
                        </span>
                      )}
                    </td>
                  </tr>
                  {open && (
                    <tr className="border-b border-border bg-surface-subtle">
                      <td colSpan={7} className="px-5 pb-5 pt-1">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-text-tertiary">{t.tableName} has 10 data quality checks. Click Test on a check to run it, or run all 10 at once.</p>
                          <Button size="sm" onClick={() => onRunAll(t.tableName)} disabled={anyRunning}>
                            <Play className="size-3" />
                            Run all checks
                          </Button>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
                          <table className="w-full min-w-[980px] border-collapse text-left text-xs">
                            <thead>
                              <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                                <th className="px-3 py-2">#</th>
                                <th className="px-3 py-2">Data quality check</th>
                                <th className="px-3 py-2">What it detects</th>
                                <th className="px-3 py-2">Example</th>
                                <th className="px-3 py-2">Threshold</th>
                                <th className="px-3 py-2">Result</th>
                                <th className="px-3 py-2">Test</th>
                              </tr>
                            </thead>
                            <tbody>
                              {DQ_CHECKS.map((c) => {
                                const r = results[key(t.tableName, c.index)];
                                return (
                                  <tr key={c.index} className="border-b border-border last:border-0 align-top">
                                    <td className="px-3 py-2.5 text-text-tertiary">{c.index}</td>
                                    <td className="px-3 py-2.5 font-medium text-text-primary">{c.name}</td>
                                    <td className="px-3 py-2.5 text-text-secondary">{c.detects}</td>
                                    <td className="px-3 py-2.5 text-text-secondary">{c.example}</td>
                                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[11px] text-text-secondary">{c.threshold}</td>
                                    <td className="px-3 py-2.5">
                                      {r === undefined ? (
                                        <span className="text-text-tertiary">Not run</span>
                                      ) : r === "running" ? (
                                        <span className="flex items-center gap-1.5 text-text-secondary">
                                          <Loader2 className="size-3.5 animate-spin text-accent-500" /> Running…
                                        </span>
                                      ) : (
                                        <div className="space-y-1">
                                          <StatusBadge style={RESULT_STYLE[r.result]} />
                                          <p className="text-[11px] text-text-secondary">{r.detail}</p>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                      <Button size="sm" variant="secondary" disabled={r === "running"} onClick={() => onRun(t.tableName, c.index)}>
                                        <Play className="size-3" />
                                        {r === undefined ? "Test" : "Re-test"}
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default function DataValidationPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CellState>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const run = useCallback((table: string, index: number, delay = 650) => {
    const k = key(table, index);
    setResults((r) => ({ ...r, [k]: "running" }));
    const check = DQ_CHECKS.find((c) => c.index === index)!;
    timers.current.push(setTimeout(() => setResults((r) => ({ ...r, [k]: runCheck(check) })), delay));
  }, []);

  const runAll = useCallback(
    (table: string) => {
      DQ_CHECKS.forEach((c, n) => {
        timers.current.push(setTimeout(() => run(table, c.index, 500), n * 320));
      });
    },
    [run],
  );

  const toggle = (t: string) => setExpanded((cur) => (cur === t ? null : t));

  return (
    <div className="flex flex-col">
      <PageHeader title="Data Validation" description="Run the 10 data quality checks on every source table and on every table that the pipelines produce." />
      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Section
          title="Source tables"
          description="Raw SAP extracts that feed the pipelines. Click a table name to open its checks, then click Test on a check to run it."
          tables={VALIDATION_TABLES.filter((t) => t.role === "SOURCE")}
          expanded={expanded}
          onToggle={toggle}
          results={results}
          onRun={(t, i) => run(t, i)}
          onRunAll={runAll}
        />
        <Section
          title="Resulting tables"
          description="Silver and gold tables produced by the pipelines. Click a table name to open its checks, then click Test on a check to run it."
          tables={VALIDATION_TABLES.filter((t) => t.role === "RESULT")}
          expanded={expanded}
          onToggle={toggle}
          results={results}
          onRun={(t, i) => run(t, i)}
          onRunAll={runAll}
        />
      </div>
    </div>
  );
}
