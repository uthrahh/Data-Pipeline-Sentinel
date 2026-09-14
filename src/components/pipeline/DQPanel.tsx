import { DatabaseZap } from "lucide-react";
import type { DQResult } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { CHECK_STATUS_STYLES } from "@/lib/constants";

export function DQPanel({ dq }: { dq: DQResult }) {
  return (
    <Card>
      <CardHeader title="Data Quality" icon={<DatabaseZap className="size-4" />} description="Post-execution DQ checks" />
      <CardBody className="px-0 py-0">
        {dq.status === "PENDING" ? (
          <LoadingState label="Running data quality checks…" />
        ) : dq.status === "NOT_AVAILABLE" || dq.checks.length === 0 ? (
          <EmptyState title="DQ results unavailable" description="No data quality checks were recorded for this execution." className="py-8" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-[11px] uppercase tracking-wide text-text-tertiary">
                <th className="px-5 py-2.5 font-semibold">Metric</th>
                <th className="px-5 py-2.5 font-semibold">Actual</th>
                <th className="px-5 py-2.5 font-semibold">Expected</th>
                <th className="px-5 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {dq.checks.map((check) => (
                <tr key={check.metric} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-text-primary">{check.metric}</td>
                  <td className="px-5 py-3 font-mono text-xs text-text-secondary">{check.actual}</td>
                  <td className="px-5 py-3 font-mono text-xs text-text-secondary">{check.expected}</td>
                  <td className="px-5 py-3">
                    <StatusBadge style={CHECK_STATUS_STYLES[check.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardBody>
    </Card>
  );
}
