import { Clock } from "lucide-react";
import type { SLAResult } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { CHECK_STATUS_STYLES, SEVERITY_STYLES } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";

export function SLAPanel({ sla }: { sla: SLAResult }) {
  if (sla.status === "NOT_AVAILABLE") {
    return (
      <Card>
        <CardHeader title="SLA" icon={<Clock className="size-4" />} />
        <CardBody>
          <EmptyState
            title="SLA not available"
            description="No SLA is configured for this pipeline, so no breach could be evaluated."
            className="py-6"
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="SLA" icon={<Clock className="size-4" />} action={<StatusBadge style={CHECK_STATUS_STYLES[sla.status]} />} />
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Configured SLA</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{formatDuration(sla.configuredMinutes)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Actual Duration</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{formatDuration(sla.actualMinutes)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Variance</p>
            <p className="mt-1 text-sm font-medium text-text-primary">
              {sla.varianceMinutes !== null
                ? `${formatDuration(sla.varianceMinutes)} ${sla.status === "PASS" ? "under" : "over"} SLA`
                : "Execution did not complete"}
            </p>
          </div>
          {sla.criticality && (
            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Criticality</p>
              <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLES[sla.criticality].badgeClass}`}>
                {SEVERITY_STYLES[sla.criticality].label}
              </span>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
