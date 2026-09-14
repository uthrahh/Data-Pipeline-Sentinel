import type { PipelineExecutionStatus } from "@/types";
import { PIPELINE_STATUS_STYLES } from "@/lib/constants";
import { StatusBadge } from "@/components/common/StatusBadge";

export function PipelineStatusBadge({ status, size }: { status: PipelineExecutionStatus; size?: "sm" | "md" }) {
  return <StatusBadge style={PIPELINE_STATUS_STYLES[status]} size={size} pulse={status === "RUNNING"} />;
}
