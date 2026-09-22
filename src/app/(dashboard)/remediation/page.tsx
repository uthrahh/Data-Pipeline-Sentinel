"use client";

import { useIncidents } from "@/hooks/useIncidents";
import { PageHeader } from "@/components/common/PageHeader";
import { IncidentQueueCard } from "@/components/dashboard/IncidentQueueCard";
import { LoadingState } from "@/components/common/LoadingState";

export default function RemediationPage() {
  const { data, isLoading } = useIncidents();
  const withRemediation = data.items.filter((i) => i.remediation !== null);

  const active = withRemediation.filter((i) => i.status === "REMEDIATING" || i.status === "VALIDATING");
  const failed = withRemediation.filter((i) => i.status === "REMEDIATION_FAILED" || i.status === "VALIDATION_FAILED");
  const completed = withRemediation.filter((i) => i.status === "RESOLVED");

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Remediation"
        description="AI-recommended fixes that have been approved and executed, and their outcomes."
      />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        {isLoading ? (
          <LoadingState label="Loading remediation activity…" className="py-16" />
        ) : (
          <>
            <IncidentQueueCard
              title="In Progress"
              description="Remediation running, or post-remediation validation in progress."
              incidents={active}
              emptyTitle="No active remediation"
              emptyDescription="No approved fixes are currently executing."
            />
            <IncidentQueueCard
              title="Needs Manual Review"
              description="Remediation ran, but the job or the post-remediation validation failed."
              incidents={failed}
              emptyTitle="Nothing needs manual review"
              emptyDescription="All remediation attempts have either succeeded or are still in progress."
            />
            <IncidentQueueCard
              title="Recently Resolved"
              description="Remediation completed and passed post-remediation DQ and SLA validation."
              incidents={completed}
              emptyTitle="No resolved remediations yet"
            />
          </>
        )}
      </div>
    </div>
  );
}
