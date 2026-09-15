import type { Incident } from "@/types";
import { PipelineLifecycle } from "@/components/pipeline/PipelineLifecycle";
import { FailureDetails } from "@/components/pipeline/FailureDetails";
import { RemediationPanel } from "@/components/pipeline/RemediationPanel";
import { ValidationPanel } from "@/components/pipeline/ValidationPanel";
import { AuditTimeline } from "@/components/pipeline/AuditTimeline";
import { Card, CardBody } from "@/components/common/Card";
import { IncidentAnalysisPanel } from "./IncidentAnalysisPanel";

interface IncidentLifecycleSectionsProps {
  incident: Incident;
  onApprove: (decidedBy: string) => void;
  onReject: (decidedBy: string, reason: string) => void;
  isSubmittingAction: boolean;
  actionError: string | null;
}

/**
 * Composes the incident detail story in order: lifecycle position -> what
 * failed -> AI's analysis and the human decision it produced -> remediation
 * execution (only once approved) -> post-remediation validation (only once
 * remediation has run) -> audit trail. Each downstream section is state-aware
 * and simply omits itself when not yet relevant to `incident.status`.
 */
export function IncidentLifecycleSections({
  incident,
  onApprove,
  onReject,
  isSubmittingAction,
  actionError,
}: IncidentLifecycleSectionsProps) {
  const showValidation = incident.status === "VALIDATING" || incident.postValidation !== null;

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <PipelineLifecycle status={incident.status} />
        </CardBody>
      </Card>

      <FailureDetails incident={incident} />

      <IncidentAnalysisPanel
        incident={incident}
        onApprove={onApprove}
        onReject={onReject}
        isSubmittingAction={isSubmittingAction}
        actionError={actionError}
      />

      {incident.remediation && <RemediationPanel remediation={incident.remediation} />}

      {showValidation && <ValidationPanel postValidation={incident.postValidation} isValidating={incident.status === "VALIDATING"} />}

      <AuditTimeline events={incident.audit} />
    </div>
  );
}
