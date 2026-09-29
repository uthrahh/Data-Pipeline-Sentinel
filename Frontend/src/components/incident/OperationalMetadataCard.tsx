import { ShieldCheck } from "lucide-react";
import type { Incident } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { approvalStatusLabel, remediationStatusLabel, validationStatusLabel } from "@/lib/operationalStatus";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

const DASH = "—";

/**
 * The metrics the separately-deployed ai-dataops-assistant system's incident
 * API exposes (execution_type, guardrail_id/decision, issue_type,
 * criticality, approval/remediation/validation status, recommended_action,
 * final_message) — shown here as a dedicated section so they're visible
 * regardless of this model's own (differently-shaped) status handling.
 */
export function OperationalMetadataCard({ incident }: { incident: Incident }) {
  return (
    <Card>
      <CardHeader title="Operational Metadata" description="Execution, guardrail, and status metrics." icon={<ShieldCheck className="size-4" />} />
      <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Field label="Execution Type" value={incident.executionType ?? "JOB"} />
        <Field label="Issue Type" value={incident.issueType ?? DASH} />
        <Field label="Criticality" value={incident.criticality ?? DASH} />
        <Field label="Guardrail ID" value={incident.guardrailId ?? DASH} />
        <Field label="Guardrail Decision" value={incident.guardrailDecision ?? DASH} />
        <Field label="Recommended Action" value={incident.recommendation?.action ? incident.recommendation.action : DASH} />
        <Field label="Approval Status" value={approvalStatusLabel(incident)} />
        <Field label="Remediation Status" value={remediationStatusLabel(incident)} />
        <Field label="Validation Status" value={validationStatusLabel(incident)} />
        {incident.finalMessage && (
          <div className="col-span-full border-t border-border pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Final Message</p>
            <p className="mt-1 text-sm text-text-secondary">{incident.finalMessage}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
