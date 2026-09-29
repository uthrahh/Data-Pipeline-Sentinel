"use client";

import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useIncidentFromStore } from "@/lib/incidentStore";
import { useNotificationFromStore } from "@/lib/notificationStore";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { INCIDENT_STATUS_STYLES, SEVERITY_STYLES, FAILURE_TYPE_STYLES } from "@/lib/constants";
import { FailureDetails } from "@/components/pipeline/FailureDetails";
import { InvestigationPanel } from "@/components/pipeline/InvestigationPanel";
import { DQPanel } from "@/components/pipeline/DQPanel";
import { SLAPanel } from "@/components/pipeline/SLAPanel";
import { AuditTimeline } from "@/components/pipeline/AuditTimeline";
import { RegressionTestCard } from "@/components/incident/RegressionTestCard";
import { NotificationLinkCard } from "@/components/incident/NotificationLinkCard";
import { DataQualityDecisionPanel } from "@/components/incident/DataQualityDecisionPanel";
import { OperationalMetadataCard } from "@/components/incident/OperationalMetadataCard";
import { formatDateTime } from "@/lib/utils";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

export default function IncidentDetailPage() {
  const params = useParams<{ incidentId: string }>();
  const router = useRouter();
  const incidentId = decodeURIComponent(params.incidentId);
  const incident = useIncidentFromStore(incidentId);
  const notification = useNotificationFromStore(incident?.notificationId ?? "__none__");

  if (!incident) {
    return (
      <EmptyState
        title="Incident not found"
        description={`No incident matches ID "${incidentId}".`}
        className="py-24"
        action={
          <button onClick={() => router.push("/incidents")} className="text-xs font-medium text-accent-600 hover:text-accent-700">
            Back to all incidents
          </button>
        }
      />
    );
  }

  const isDqBreachUndecided = incident.status === "WAITING_APPROVAL" && incident.failure.errorType === "DATA_QUALITY_BREACH" && !incident.notificationId;

  return (
    <div className="flex flex-col">
      <PageHeader
        title={incident.incidentId}
        breadcrumbs={[{ label: "Incidents", href: "/incidents" }, { label: incident.incidentId }]}
        badge={<StatusBadge style={INCIDENT_STATUS_STYLES[incident.status]} size="md" />}
        actions={
          <button
            onClick={() => router.push("/incidents")}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft className="size-3.5" />
            All Incidents
          </button>
        }
      />

      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge style={INCIDENT_STATUS_STYLES[incident.status]} size="md" pulse={incident.status === "REMEDIATING"} />
            <StatusBadge style={SEVERITY_STYLES[incident.severity]} size="md" />
            <StatusBadge style={FAILURE_TYPE_STYLES[incident.failure.errorType]} size="md" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Field label="Pipeline" value={incident.pipelineName} />
            <Field label="Run ID" value={<span className="font-mono text-xs">{incident.pipelineRunId}</span>} />
            <Field label="Detected" value={formatDateTime(incident.detectedAt)} />
            <Field label="Assignee" value={incident.assignee ?? "Unassigned"} />
            <Field label="Assignee Email" value={incident.assigneeEmail ?? "—"} />
          </div>
        </div>

        <FailureDetails incident={incident} />

        <OperationalMetadataCard incident={incident} />

        {isDqBreachUndecided && <DataQualityDecisionPanel incident={incident} />}

        {incident.investigation && (
          <Card>
            <CardBody>
              <InvestigationPanel investigation={incident.investigation} />
            </CardBody>
          </Card>
        )}

        {incident.dq && (
          <Card>
            <CardBody>
              <DQPanel dq={incident.dq} />
            </CardBody>
          </Card>
        )}

        {incident.sla && (
          <Card>
            <CardBody>
              <SLAPanel sla={incident.sla} />
            </CardBody>
          </Card>
        )}

        {incident.recommendation && (
          <Card>
            <CardHeader title="Recommendation" icon={<Sparkles className="size-4" />} />
            <CardBody>
              <p className="text-sm font-medium text-text-primary">{incident.recommendation.action}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{incident.recommendation.reason}</p>
            </CardBody>
          </Card>
        )}

        {notification && <NotificationLinkCard notification={notification} />}

        {incident.regressionTest && <RegressionTestCard test={incident.regressionTest} />}

        <AuditTimeline events={incident.audit} />
      </div>
    </div>
  );
}
