import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Incident } from "@/types";
import { INCIDENT_STATUS_STYLES, SEVERITY_STYLES } from "@/lib/constants";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatRelativeTime } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export function IncidentQueueCard({
  title,
  description,
  incidents,
  emptyTitle,
  emptyDescription,
  viewAllHref,
}: {
  title: string;
  description?: string;
  incidents: Incident[];
  emptyTitle: string;
  emptyDescription?: string;
  viewAllHref?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
        </div>
        {viewAllHref && incidents.length > 0 && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700"
          >
            View all
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      {incidents.length === 0 ? (
        <EmptyState icon={CheckCircle2} title={emptyTitle} description={emptyDescription} className="py-10" />
      ) : (
        <ul className="divide-y divide-border">
          {incidents.map((incident) => (
            <li key={incident.incidentId}>
              <Link
                href={`/incidents/${incident.incidentId}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle"
              >
                <span className={`size-1.5 shrink-0 rounded-full ${SEVERITY_STYLES[incident.severity].dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-text-primary">{incident.pipelineName}</p>
                    <span className="shrink-0 font-mono text-[10px] text-text-tertiary">{incident.incidentId}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-tertiary">
                    {incident.recommendation?.action ?? incident.failure.errorMessage}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge style={INCIDENT_STATUS_STYLES[incident.status]} pulse={incident.status === "REMEDIATING"} />
                  <span className="text-[10px] text-text-tertiary">{formatRelativeTime(incident.detectedAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
