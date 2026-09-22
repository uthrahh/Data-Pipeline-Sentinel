import { BadgeCheck, CircleAlert } from "lucide-react";
import type { PostValidation } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingState } from "@/components/common/LoadingState";
import { CHECK_STATUS_STYLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ValidationPanelProps {
  postValidation: PostValidation | null;
  isValidating: boolean;
}

export function ValidationPanel({ postValidation, isValidating }: ValidationPanelProps) {
  return (
    <Card>
      <CardHeader
        title="Post-Remediation Validation"
        icon={<BadgeCheck className="size-4" />}
        description="A successful job does not by itself confirm the data problem is solved"
      />
      <CardBody>
        {isValidating || !postValidation ? (
          <LoadingState label="Validating data quality and SLA after remediation…" />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <ValidationCell label="Data Quality" status={postValidation.dqStatus} />
              <ValidationCell label="SLA" status={postValidation.slaStatus} />
              <ValidationCell
                label="Final Validation"
                status={postValidation.overallStatus === "PASS" ? "PASS" : postValidation.overallStatus === "FAIL" ? "FAIL" : "PENDING"}
                emphasized
              />
            </div>

            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-3",
                postValidation.overallStatus === "PASS"
                  ? "border-success-500/20 bg-success-50"
                  : "border-danger-500/20 bg-danger-50",
              )}
            >
              {postValidation.overallStatus === "PASS" ? (
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success-600" />
              ) : (
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger-600" />
              )}
              <p className={cn("text-sm", postValidation.overallStatus === "PASS" ? "text-success-700" : "text-danger-700")}>
                {postValidation.overallStatus === "PASS" ? (
                  <>
                    <span className="font-semibold">Result: Resolved.</span> The remediation job succeeded and post-run DQ/SLA checks both passed.
                  </>
                ) : (
                  <>
                    <span className="font-semibold">Result: Validation Failed.</span> The remediation job completed successfully, but
                    post-run validation found the underlying data problem was not actually resolved. The incident remains open.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function ValidationCell({
  label,
  status,
  emphasized = false,
}: {
  label: string;
  status: "PASS" | "FAIL" | "WARNING" | "NOT_AVAILABLE" | "PENDING";
  emphasized?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border border-border px-4 py-3", emphasized && "bg-surface-subtle")}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <div className="mt-1.5">
        <StatusBadge style={CHECK_STATUS_STYLES[status]} size="md" />
      </div>
    </div>
  );
}
