import type { PipelineExecution } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { formatDuration } from "@/lib/utils";
import { ListTree } from "lucide-react";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-text-tertiary">{label}</span>
      <span className="font-medium text-text-primary">{value}</span>
    </div>
  );
}

export function ExecutionOverview({ execution }: { execution: PipelineExecution }) {
  return (
    <Card>
      <CardHeader title="Execution Overview" icon={<ListTree className="size-4" />} />
      <CardBody className="py-1">
        <Row label="Activity" value={execution.activityName} />
        <Row label="Execution Type" value={execution.executionType} />
        <Row label="Trigger Type" value={execution.trigger.type} />
        <Row label="Owner" value={execution.owner ?? "Unassigned"} />
        <Row label="Country" value={execution.country ?? "N/A"} />
        <Row label="Configured SLA" value={execution.slaMinutes ? formatDuration(execution.slaMinutes) : "Not configured"} />
      </CardBody>
    </Card>
  );
}
