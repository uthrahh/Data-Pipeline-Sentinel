import { DatabaseZap } from "lucide-react";
import type { DQResult } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { ProcessTrail } from "@/components/common/ProcessTrail";
import { AgentBadge } from "@/components/common/AgentBadge";
import { CHECK_STATUS_STYLES } from "@/lib/constants";

/**
 * One section within IncidentAnalysisPanel — not a standalone card. Always
 * shows the agent's process trail separately from its concluded response.
 */
export function DQPanel({ dq }: { dq: DQResult }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <DatabaseZap className="size-4 text-text-tertiary" />
          Data Quality
        </div>
        <AgentBadge agentId="data_quality" />
      </div>

      {dq.status === "PENDING" ? (
        <LoadingState label="Running data quality checks…" className="py-6" />
      ) : dq.status === "NOT_AVAILABLE" || dq.checks.length === 0 ? (
        <EmptyState title="DQ results unavailable" description="No data quality checks were recorded for this execution." className="py-6" />
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Process</p>
            <ProcessTrail steps={dq.processSteps} />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Agent Response</p>
            <div className="rounded-lg border border-border bg-surface-subtle px-4 py-3">
              <p className="text-sm leading-relaxed text-text-primary">{dq.summary}</p>
            </div>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wide text-text-tertiary">
                <th className="py-2 font-semibold">Metric</th>
                <th className="py-2 font-semibold">Actual</th>
                <th className="py-2 font-semibold">Expected</th>
                <th className="py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {dq.checks.map((check) => (
                <tr key={check.metric} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium text-text-primary">{check.metric}</td>
                  <td className="py-2.5 font-mono text-xs text-text-secondary">{check.actual}</td>
                  <td className="py-2.5 font-mono text-xs text-text-secondary">{check.expected}</td>
                  <td className="py-2.5">
                    <StatusBadge style={CHECK_STATUS_STYLES[check.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
