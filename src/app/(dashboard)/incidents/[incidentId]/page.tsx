"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useIncident } from "@/hooks/useIncident";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { IncidentHeader } from "@/components/incident/IncidentHeader";
import { IncidentLifecycleSections } from "@/components/incident/IncidentLifecycleSections";
import { StatusBadge } from "@/components/common/StatusBadge";
import { INCIDENT_STATUS_STYLES } from "@/lib/constants";

export default function IncidentDetailPage() {
  const params = useParams<{ incidentId: string }>();
  const router = useRouter();
  const incidentId = decodeURIComponent(params.incidentId);

  const { data: incident, isLoading, error, notFound, approve, reject, isSubmittingAction, actionError } = useIncident(incidentId);

  if (isLoading) {
    return <LoadingState label="Loading incident…" className="py-24" />;
  }

  if (notFound) {
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

  if (error || !incident) {
    return <ErrorState description={error ?? "Unable to load this incident."} className="py-24" />;
  }

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
        <IncidentHeader incident={incident} />
        <IncidentLifecycleSections
          incident={incident}
          onApprove={approve}
          onReject={reject}
          isSubmittingAction={isSubmittingAction}
          actionError={actionError}
        />
      </div>
    </div>
  );
}
