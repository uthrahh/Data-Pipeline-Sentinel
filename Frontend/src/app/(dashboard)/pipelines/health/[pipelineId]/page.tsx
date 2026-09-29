"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DQPanel } from "@/components/pipeline/DQPanel";
import { SLAPanel } from "@/components/pipeline/SLAPanel";
import { useOverviewSettings } from "@/lib/overviewSettings";
import { buildPipelineSummaries } from "@/data/mock/pipelineSummaries";
import { useIncidentFromStore } from "@/lib/incidentStore";
import { useNotificationFromStore } from "@/lib/notificationStore";
import { NotificationLinkCard } from "@/components/incident/NotificationLinkCard";
import { PIPELINE_STATUS_STYLES, INCIDENT_STATUS_STYLES } from "@/lib/constants";
import { formatDateTime, formatDuration } from "@/lib/utils";
import type { DQResult, SLAResult } from "@/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm font-medium text-text-primary">{value}</p>
    </div>
  );
}

const CLEAN_DQ: DQResult = {
  status: "COMPLETE",
  completedAt: null,
  processSteps: ["Ran null detection across all columns.", "Ran invalid/irregular character detection."],
  summary: "No data quality issues found.",
  checks: [
    { metric: "Null Detection", actual: "0 nulls", expected: "0 nulls", status: "PASS" },
    { metric: "Invalid Character Detection", actual: "0 flagged rows", expected: "0 flagged rows", status: "PASS" },
  ],
};

/**
 * "First success pipeline" detail view (spec 1.1/1.3): everything about one
 * run — timing, DQ (null detection + others, never data-count-based),
 * SLA (scheduled vs. actual), and, when the pipeline is SUCCESS - PARTIAL,
 * a link to the optimization notification it generated.
 */
export default function PipelineHealthDetailPage() {
  const params = useParams<{ pipelineId: string }>();
  const router = useRouter();
  const pipelineId = decodeURIComponent(params.pipelineId);
  const { settings } = useOverviewSettings();
  const pipelines = useMemo(() => buildPipelineSummaries(settings), [settings]);
  const pipeline = pipelines.find((p) => p.id === pipelineId);

  const incident = useIncidentFromStore(pipeline?.incidentId ?? "__none__");
  const notification = useNotificationFromStore(incident?.notificationId ?? "__none__");

  if (!pipeline) {
    return (
      <EmptyState
        title="Pipeline not found"
        description={`No pipeline matches ID "${pipelineId}".`}
        className="py-24"
        action={
          <button onClick={() => router.push("/pipelines/health")} className="text-xs font-medium text-accent-600 hover:text-accent-700">
            Back to Pipeline Health
          </button>
        }
      />
    );
  }

  const dq: DQResult | null = incident?.dq ?? (pipeline.status === "SUCCESS" ? CLEAN_DQ : null);
  const sla: SLAResult | null =
    incident?.sla ??
    (pipeline.durationMinutes !== null
      ? {
          status: pipeline.durationMinutes <= pipeline.slaMinutes ? "PASS" : "WARNING",
          processSteps: ["Compared actual completion time against the configured SLA."],
          summary: pipeline.durationMinutes <= pipeline.slaMinutes ? "Completed within SLA." : "Exceeded the configured SLA.",
          configuredMinutes: pipeline.slaMinutes,
          actualMinutes: pipeline.durationMinutes,
          varianceMinutes: pipeline.durationMinutes - pipeline.slaMinutes,
          criticality: "LOW",
        }
      : null);

  return (
    <div className="flex flex-col">
      <PageHeader
        title={pipeline.name}
        breadcrumbs={[{ label: "Overview", href: "/overview" }, { label: "Pipeline Health", href: "/pipelines/health" }, { label: pipeline.name }]}
        badge={<StatusBadge style={PIPELINE_STATUS_STYLES[pipeline.status]} size="md" />}
        actions={
          <button
            onClick={() => router.push("/pipelines/health")}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft className="size-3.5" />
            All Pipelines
          </button>
        }
      />

      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
        <Card>
          <CardHeader
            title="Execution Overview"
            description={incident ? <>Linked incident: <Link href={`/incidents/${incident.incidentId}`} className="text-accent-600 hover:text-accent-700">{incident.incidentId}</Link></> : "Clean run — no incident."}
            action={incident && <StatusBadge style={INCIDENT_STATUS_STYLES[incident.status]} />}
          />
          <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Field label="Run ID" value={<span className="font-mono text-xs">{pipeline.lastRunId}</span>} />
            <Field label="Overall Status" value={<StatusBadge style={PIPELINE_STATUS_STYLES[pipeline.status]} />} />
            <Field label="Owner" value={pipeline.owner} />
            <Field label="Scheduled Run Time" value={formatDateTime(pipeline.scheduledTime)} />
            <Field label="Actual Completion Time" value={formatDateTime(pipeline.actualCompletionTime)} />
            <Field label="Duration" value={formatDuration(pipeline.durationMinutes)} />
            <Field label="Configured SLA" value={formatDuration(pipeline.slaMinutes)} />
            <Field label="Source Tables" value={pipeline.sourceTables.length > 0 ? <span className="font-mono text-[11px]">{pipeline.sourceTables.join(", ")}</span> : "—"} />
            <Field label="Target Table" value={pipeline.targetTable ? <span className="font-mono text-[11px] text-accent-600">{pipeline.targetTable}</span> : "—"} />
          </CardBody>
        </Card>

        {incident?.status === "SUCCESS_PARTIAL" ? (
          <div className="flex items-center gap-3 rounded-xl border border-warning-500/30 bg-warning-50 px-5 py-4">
            <Sparkles className="size-5 shrink-0 text-warning-600" />
            <div>
              <p className="text-sm font-semibold text-warning-700">Optimization required</p>
              <p className="text-sm text-warning-700/80">DQ or SLA exceeded the configured limit on this run — marked Success - Partial. See the notification below.</p>
            </div>
          </div>
        ) : null}

        {dq && (
          <Card>
            <CardBody>
              <DQPanel dq={dq} />
            </CardBody>
          </Card>
        )}

        {sla && (
          <Card>
            <CardBody>
              <SLAPanel sla={sla} />
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Issues / Observations" />
          <CardBody>
            <p className="text-sm text-text-secondary">{incident ? incident.failure.errorMessage : "None — this pipeline completed cleanly."}</p>
          </CardBody>
        </Card>

        {notification && <NotificationLinkCard notification={notification} />}
      </div>
    </div>
  );
}
