import type { Incident } from "@/types";
import { PipelineLifecycle } from "@/components/pipeline/PipelineLifecycle";
import { FailureDetails } from "@/components/pipeline/FailureDetails";
import { InvestigationPanel } from "@/components/pipeline/InvestigationPanel";
import { DQPanel } from "@/components/pipeline/DQPanel";
import { SLAPanel } from "@/components/pipeline/SLAPanel";
import { RecommendationPanel } from "@/components/pipeline/RecommendationPanel";
import { ApprovalPanel } from "@/components/pipeline/ApprovalPanel";
import { RemediationPanel } from "@/components/pipeline/RemediationPanel";
import { ValidationPanel } from "@/components/pipeline/ValidationPanel";
import { AuditTimeline } from "@/components/pipeline/AuditTimeline";
import { Card, CardBody } from "@/components/common/Card";

interface IncidentLifecycleSectionsProps {
  incident: Incident;
  onApprove: (decidedBy: string) => void;
  onReject: (decidedBy: string, reason: string) => void;
  isSubmittingAction: boolean;
  actionError: string | null;
}

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

      {incident.investigation && <InvestigationPanel investigation={incident.investigation} />}

      {(incident.dq || incident.sla) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {incident.dq && <DQPanel dq={incident.dq} />}
          {incident.sla && <SLAPanel sla={incident.sla} />}
        </div>
      )}

      {incident.recommendation && <RecommendationPanel recommendation={incident.recommendation} />}

      {incident.approval && (
        <ApprovalPanel
          incident={incident}
          onApprove={onApprove}
          onReject={onReject}
          isSubmitting={isSubmittingAction}
          actionError={actionError}
        />
      )}

      {incident.remediation && <RemediationPanel remediation={incident.remediation} />}

      {showValidation && <ValidationPanel postValidation={incident.postValidation} isValidating={incident.status === "VALIDATING"} />}

      <AuditTimeline events={incident.audit} />
    </div>
  );
}
