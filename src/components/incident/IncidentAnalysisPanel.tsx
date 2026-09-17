import type { Incident } from "@/types";
import { Card, CardHeader } from "@/components/common/Card";
import { InvestigationPanel } from "@/components/pipeline/InvestigationPanel";
import { DQPanel } from "@/components/pipeline/DQPanel";
import { SLAPanel } from "@/components/pipeline/SLAPanel";
import { HumanDecisionPanel } from "@/components/pipeline/HumanDecisionPanel";
import { ClipboardCheck } from "lucide-react";

interface IncidentAnalysisPanelProps {
  incident: Incident;
  onApprove: (decidedBy: string) => void;
  onReject: (decidedBy: string, reason: string) => void;
  isSubmittingAction: boolean;
  actionError: string | null;
}

/**
 * The incident's investigation, DQ, and SLA analysis, plus the human
 * decision that follows from them, live in one container — they're one
 * continuous investigation/validation process, not unrelated cards.
 */
export function IncidentAnalysisPanel({
  incident,
  onApprove,
  onReject,
  isSubmittingAction,
  actionError,
}: IncidentAnalysisPanelProps) {
  return (
    <Card>
      <CardHeader
        title="Incident Analysis"
        description="Investigation, data quality, and SLA — each handled by a dedicated agent"
        icon={<ClipboardCheck className="size-4" />}
      />
      <div className="divide-y divide-border">
        {incident.investigation && (
          <div className="px-5 py-5">
            <InvestigationPanel investigation={incident.investigation} />
          </div>
        )}
        {incident.dq && (
          <div className="px-5 py-5">
            <DQPanel dq={incident.dq} />
          </div>
        )}
        {incident.sla && (
          <div className="px-5 py-5">
            <SLAPanel sla={incident.sla} />
          </div>
        )}
        {incident.approval && incident.recommendation && (
          <div className="px-5 py-5">
            <HumanDecisionPanel
              incident={incident}
              onApprove={onApprove}
              onReject={onReject}
              isSubmitting={isSubmittingAction}
              actionError={actionError}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
