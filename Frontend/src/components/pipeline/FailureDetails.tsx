import { ExternalLink, OctagonAlert } from "lucide-react";
import type { Incident } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { formatDateTime } from "@/lib/utils";

export function FailureDetails({ incident }: { incident: Incident }) {
  return (
    <Card>
      <CardHeader
        title="Failure Details"
        icon={<OctagonAlert className="size-4" />}
        description={`Incident ${incident.incidentId}`}
      />
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Failure Type</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{incident.failure.errorType}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Error Code</p>
            <p className="mt-1 font-mono text-sm font-medium text-text-primary">{incident.failure.errorCode}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Detected</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{formatDateTime(incident.detectedAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Target</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{incident.failure.target ?? "N/A"}</p>
          </div>
        </div>

        <div className="rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3">
          <p className="font-mono text-xs leading-relaxed text-danger-700">{incident.failure.errorMessage}</p>
        </div>

        {incident.failure.runPageUrl && (
          <a
            href={incident.failure.runPageUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700"
          >
            View run output in Databricks
            <ExternalLink className="size-3.5" />
          </a>
        )}
      </CardBody>
    </Card>
  );
}
