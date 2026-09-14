"use client";

import { useRouter } from "next/navigation";
import type { Incident } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { TableRowsSkeleton } from "@/components/common/LoadingState";
import { INCIDENT_STATUS_STYLES, SEVERITY_STYLES } from "@/lib/constants";
import { cn, formatDateTime, truncate } from "@/lib/utils";

interface IncidentsTableProps {
  incidents: Incident[];
  isLoading: boolean;
  error: string | null;
}

export function IncidentsTable({ incidents, isLoading, error }: IncidentsTableProps) {
  const router = useRouter();

  if (error) return <ErrorState description={error} />;
  if (!isLoading && incidents.length === 0) {
    return (
      <EmptyState
        title="No incidents found"
        description="Try adjusting your filters — or this may mean every pipeline is healthy."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-2.5">Severity</th>
            <th className="px-4 py-2.5">Incident</th>
            <th className="px-4 py-2.5">Pipeline</th>
            <th className="px-4 py-2.5">Detected</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5">Recommendation / Error</th>
            <th className="px-4 py-2.5">Assignee</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <TableRowsSkeleton rows={6} cols={7} />
          ) : (
            incidents.map((incident) => (
              <tr
                key={incident.incidentId}
                tabIndex={0}
                role="button"
                onClick={() => router.push(`/incidents/${incident.incidentId}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/incidents/${incident.incidentId}`)}
                className="cursor-pointer border-b border-border text-xs transition-colors last:border-0 hover:bg-surface-subtle"
              >
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium", SEVERITY_STYLES[incident.severity].badgeClass)}>
                    <span className={cn("size-1.5 rounded-full", SEVERITY_STYLES[incident.severity].dot)} />
                    {SEVERITY_STYLES[incident.severity].label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-text-tertiary">{incident.incidentId}</td>
                <td className="px-4 py-3 font-medium text-text-primary">{incident.pipelineName}</td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(incident.detectedAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge style={INCIDENT_STATUS_STYLES[incident.status]} pulse={incident.status === "REMEDIATING"} />
                </td>
                <td className="max-w-[260px] px-4 py-3 text-text-secondary">
                  {truncate(incident.recommendation?.action ?? incident.failure.errorMessage, 60)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{incident.assignee ?? "Unassigned"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
