"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DATA_QUALITY_TABLES } from "@/data/mock/dataQuality";
import { formatDateTime, formatNumber } from "@/lib/utils";

const LOAD_TYPE_LABEL: Record<string, string> = {
  FULL_LOAD: "Full Load",
  INCREMENTAL: "Incremental",
  CDC: "CDC",
};

/**
 * "Data Quality Check-up" drill-down: every table in
 * ai_dataops_poc.sap_demo — real row counts, last-loaded timestamps, and
 * null-value analysis pulled directly from the workspace (see
 * data/mock/dataQuality.ts for provenance), not re-queried at runtime.
 */
export default function DataQualityPage() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Data Quality Check-up"
        description="Row counts, last load, and null-value checks across every monitored table."
        breadcrumbs={[{ label: "Overview", href: "/overview" }, { label: "Data Quality" }]}
      />

      <div className="p-4 sm:p-6">
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-subtle">
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Table Name</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Data Count</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Last Loaded / Updated</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Load Type</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Null Value Analysis</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">DQ Check</th>
              </tr>
            </thead>
            <tbody>
              {DATA_QUALITY_TABLES.map((t) => (
                <tr key={t.fqName} className="border-b border-border text-xs transition-colors last:border-0 hover:bg-surface-subtle">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text-primary">{t.tableName}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-text-tertiary">{t.fqName}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatNumber(t.rowCount)} rows</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(t.lastLoadedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{LOAD_TYPE_LABEL[t.loadType] ?? t.loadType}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {t.nullValueCount} null{t.nullValueCount === 1 ? "" : "s"} across {t.columnCount} columns
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge
                      style={
                        t.dqStatus === "PASS"
                          ? { label: "Pass", dot: "bg-success-500", badgeClass: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20" }
                          : { label: "Fail", dot: "bg-danger-500", badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20" }
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
