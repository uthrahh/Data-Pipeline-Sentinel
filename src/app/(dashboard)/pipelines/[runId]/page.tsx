"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { usePipeline } from "@/hooks/usePipeline";
import { useIncident } from "@/hooks/useIncident";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { ExecutionOverview } from "@/components/pipeline/ExecutionOverview";
import { PipelineStatusBadge } from "@/components/dashboard/PipelineStatusBadge";
import { IncidentLifecycleSections } from "@/components/incident/IncidentLifecycleSections";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PipelineDetailPage() {
  const params = useParams<{ runId: string }>();
  const router = useRouter();
  const runId = decodeURIComponent(params.runId);

  const { data: execution, isLoading, error, notFound } = usePipeline(runId);
  const incidentHook = useIncident(execution?.incidentId ?? "__none__");

  if (isLoading) {
    return <LoadingState label="Loading pipeline execution…" className="py-24" />;
  }

  if (notFound) {
    return (
      <EmptyState
        title="Pipeline execution not found"
        description={`No execution matches run ID "${runId}".`}
        className="py-24"
        action={
          <button onClick={() => router.push("/pipelines")} className="text-xs font-medium text-accent-600 hover:text-accent-700">
            Back to all pipelines
          </button>
        }
      />
    );
  }

  if (error || !execution) {
    return <ErrorState description={error ?? "Unable to load this pipeline execution."} className="py-24" />;
  }

  const hasIncident = Boolean(execution.incidentId);

  return (
    <div className="flex flex-col">
      <PageHeader
        title={execution.pipelineName}
        breadcrumbs={[{ label: "Pipelines", href: "/pipelines" }, { label: execution.runId }]}
        badge={<PipelineStatusBadge status={execution.status} size="md" />}
        actions={
          <button
            onClick={() => router.push("/pipelines")}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft className="size-3.5" />
            All Pipelines
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 p-4 sm:p-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <PipelineHeader execution={execution} />

          {hasIncident ? (
            incidentHook.isLoading ? (
              <LoadingState label="Loading incident…" />
            ) : incidentHook.data ? (
              <IncidentLifecycleSections
                incident={incidentHook.data}
                onApprove={incidentHook.approve}
                onReject={incidentHook.reject}
                isSubmittingAction={incidentHook.isSubmittingAction}
                actionError={incidentHook.actionError}
              />
            ) : (
              <ErrorState description="Unable to load the linked incident." />
            )
          ) : execution.status === "RUNNING" ? (
            <div className="flex items-center gap-3 rounded-xl border border-info-500/20 bg-info-50 px-5 py-4">
              <Loader2 className="size-5 animate-spin text-info-600" />
              <p className="text-sm text-info-700">This pipeline is currently executing. Status will update automatically once it completes.</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-success-500/20 bg-success-50 px-5 py-4">
              <CheckCircle2 className="size-5 text-success-600" />
              <p className="text-sm text-success-700">This execution completed with no incident — no further action needed.</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <ExecutionOverview execution={execution} />
        </div>
      </div>
    </div>
  );
}
