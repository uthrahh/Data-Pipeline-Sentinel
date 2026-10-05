"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Circle,
  FlaskConical,
  Loader2,
  Mail,
  Rocket,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Wrench,
  XCircle,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { AuditTimeline } from "@/components/pipeline/AuditTimeline";
import { EmailModal, RemediationStartedModal } from "@/components/incident/IncidentModals";
import { COUNTRY_LABEL, SLA_BASELINE_MINUTES } from "@/ops/catalog";
import { approvalStatus, guardrailDecision, guardrailOf, remediationStatus, validationStatus } from "@/ops/derive";
import { FAILURE_BY_KEY } from "@/ops/failureTypes";
import { approveAndRemediate, rejectIncident, useOps, type RemediationStart } from "@/ops/store";
import { INCIDENT_STATUS_STYLES, SEVERITY_STYLES, SLA_STYLES } from "@/ops/styles";
import { fill } from "@/ops/text";
import type { Incident } from "@/ops/types";
import { cn, formatDateTime, formatDuration } from "@/lib/utils";

type StepState = "done" | "active" | "pending" | "blocked";

const REMEDIATION_RUN_MS = 7000;

function Kv({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className={cn("mt-1 break-words text-sm font-medium text-text-primary", mono && "font-mono text-xs")}>{children}</p>
    </div>
  );
}

function StepIcon({ state, n }: { state: StepState; n: number }) {
  if (state === "done") return <CheckCircle2 className="size-6 text-success-600" />;
  if (state === "blocked") return <XCircle className="size-6 text-text-tertiary" />;
  if (state === "active")
    return (
      <span className="flex size-6 items-center justify-center rounded-full bg-accent-500 text-[11px] font-semibold text-white">
        <Loader2 className="size-3.5 animate-spin" aria-label={`Step ${n} in progress`} />
      </span>
    );
  return (
    <span className="flex size-6 items-center justify-center rounded-full border border-border-strong bg-surface text-[11px] font-semibold text-text-tertiary">
      {n}
    </span>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  state,
  summary,
  defaultOpen,
  last,
  children,
}: {
  n: number;
  icon: LucideIcon;
  title: string;
  state: StepState;
  summary: string;
  defaultOpen: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <li className="relative flex gap-4">
      {!last && <span className="absolute left-3 top-8 h-[calc(100%-16px)] w-px bg-border" aria-hidden />}
      <div className="relative z-10 shrink-0 bg-surface pt-1">
        <StepIcon state={state} n={n} />
      </div>
      <div className="min-w-0 flex-1 pb-5">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-start justify-between gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface-subtle"
        >
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Icon className="size-3.5 text-text-tertiary" />
              {title}
            </p>
            <p className="mt-0.5 text-xs text-text-tertiary">{summary}</p>
          </div>
          <ChevronDown className={cn("mt-1 size-4 shrink-0 text-text-tertiary transition-transform", open && "rotate-180")} />
        </button>
        {open && <div className="mt-2 rounded-lg border border-border bg-surface-subtle p-4 text-sm">{children}</div>}
      </div>
    </li>
  );
}

function Checklist({ items, doneCount, activeIndex }: { items: string[]; doneCount: number; activeIndex?: number }) {
  return (
    <ul className="space-y-2">
      {items.map((text, idx) => {
        const done = idx < doneCount;
        const active = !done && idx === activeIndex;
        return (
          <li key={idx} className="flex items-start gap-2.5 text-sm">
            {done ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-600" />
            ) : active ? (
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-accent-500" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-border-strong" />
            )}
            <span className={cn(done || active ? "text-text-primary" : "text-text-tertiary")}>{text}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function IncidentDetailPage() {
  const params = useParams<{ incidentId: string }>();
  const router = useRouter();
  const { incidents, notifications } = useOps();
  const incident: Incident | undefined = useMemo(() => incidents.find((i) => i.id === decodeURIComponent(params.incidentId)), [incidents, params.incidentId]);

  const [modal, setModal] = useState<"email" | "reject" | null>(null);
  const [started, setStarted] = useState<RemediationStart | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const remediating = incident?.status === "REMEDIATING";
  useEffect(() => {
    if (!remediating) return;
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 600);
    return () => clearInterval(t);
  }, [remediating]);

  if (!incident) {
    return (
      <EmptyState
        title="Incident not found"
        description={`No incident matches ID "${decodeURIComponent(params.incidentId)}".`}
        className="py-24"
        action={
          <button onClick={() => router.push("/incidents")} className="text-xs font-medium text-accent-600 hover:text-accent-700">
            Back to all incidents
          </button>
        }
      />
    );
  }

  const def = FAILURE_BY_KEY[incident.failureKey];
  const ctx = { pipeline: incident.pipeline, country: incident.country };
  const emails = notifications.filter((n) => n.incidentId === incident.id);
  const status = incident.status;
  const canApprove = status === "WAITING_APPROVAL" && def.autoRemediable;
  const canReject = status === "WAITING_APPROVAL" || status === "ESCALATED";

  const remSteps = def.remediationSteps.map((s) => fill(s, ctx));
  let remDone = 0;
  let remActive: number | undefined;
  if (status === "RESOLVED") remDone = remSteps.length;
  else if (status === "REMEDIATING") {
    const elapsed = now && incident.remediationStartedAt ? Math.max(0, now - Date.parse(incident.remediationStartedAt)) : 0;
    remDone = Math.min(remSteps.length - 1, Math.floor((elapsed / REMEDIATION_RUN_MS) * remSteps.length));
    remActive = remDone;
  } else if (!def.autoRemediable && incident.emailSent) remDone = remSteps.length;

  const remState: StepState = status === "RESOLVED" ? "done" : status === "REJECTED" ? "blocked" : "active";
  const validationState: StepState = status === "RESOLVED" ? "done" : status === "REMEDIATING" ? "active" : status === "REJECTED" ? "blocked" : "pending";
  const slaGap = incident.durationMinutes - SLA_BASELINE_MINUTES;
  const scaleMax = Math.max(incident.durationMinutes, SLA_BASELINE_MINUTES) * 1.2;
  const closed = status === "RESOLVED";

  return (
    <div className="flex flex-col">
      <PageHeader
        title={<span className="font-mono text-lg">{incident.id}</span>}
        breadcrumbs={[{ label: "Incidents", href: "/incidents" }, { label: incident.id }]}
        badge={<StatusBadge style={INCIDENT_STATUS_STYLES[status]} size="md" pulse={status === "REMEDIATING"} />}
        actions={
          <button
            onClick={() => router.push("/incidents")}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft className="size-3.5" />
            All incidents
          </button>
        }
      />

      <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
        <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs" aria-label="Incident summary">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-border p-5 sm:grid-cols-3">
            <Kv label="Pipeline">{incident.pipeline}</Kv>
            <Kv label="Country">{COUNTRY_LABEL[incident.country]}</Kv>
            <Kv label="Failure type">{def.label}</Kv>
            <Kv label="Severity">
              <StatusBadge style={SEVERITY_STYLES[incident.severity]} />
            </Kv>
            <Kv label="Status">
              <StatusBadge style={INCIDENT_STATUS_STYLES[status]} pulse={status === "REMEDIATING"} />
            </Kv>
            <Kv label="Pipeline owner">{incident.owner.name}</Kv>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Error</p>
              <p className="mt-1 text-sm text-text-primary">{def.errorMessage}</p>
            </div>
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <Kv label="Recommended action" mono>
                {def.recommendation}
              </Kv>
              <Kv label="Remediation">{def.remediationLabel}</Kv>
            </div>

            {def.change && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface-subtle px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Current {def.change.label}</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">{def.change.current}</p>
                </div>
                <div className="rounded-lg border border-success-500/30 bg-success-50 px-4 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-success-700">Recommended {def.change.label}</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">{def.change.recommended}</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-4">
              {canApprove && (
                <Button
                  onClick={() => {
                    const info = approveAndRemediate(incident.id);
                    if (info) setStarted(info);
                  }}
                >
                  <ThumbsUp className="size-3.5" />
                  Approve &amp; remediate
                </Button>
              )}
              {canReject && (
                <Button variant="secondary" onClick={() => setModal("reject")}>
                  <ThumbsDown className="size-3.5" />
                  Reject
                </Button>
              )}
              <Button variant={canApprove ? "secondary" : "primary"} onClick={() => setModal("email")}>
                <Mail className="size-3.5" />
                {incident.emailSent ? "Send another email" : "Send email"}
              </Button>
              <p className="text-xs text-text-tertiary">
                {status === "WAITING_APPROVAL" && def.autoRemediable && "Human approval is required before the remediation runs."}
                {status === "WAITING_APPROVAL" && !def.autoRemediable && "No safe automated remediation exists — escalate to the pipeline owner by email."}
                {status === "ESCALATED" && "Escalated — waiting for the pipeline owner to fix the root cause."}
                {status === "REMEDIATING" && "Remediation is running in Databricks."}
                {status === "RESOLVED" && "This incident is resolved."}
                {status === "REJECTED" && "Remediation was rejected — no action was taken."}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 shadow-xs" aria-label="Incident workflow">
          <h2 className="mb-4 text-sm font-semibold tracking-tight text-text-primary">Incident workflow</h2>
          <ol>
            <Step n={1} icon={AlertCircle} title="Incident created" state="done" summary={`Failure detected ${formatDateTime(incident.detectedAt)} UTC on run ${incident.runId}`} defaultOpen last={false}>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                <Kv label="Incident ID" mono>
                  {incident.id}
                </Kv>
                <Kv label="Run ID" mono>
                  {incident.runId}
                </Kv>
                <Kv label="Job ID" mono>
                  {incident.jobId}
                </Kv>
                <Kv label="Detected">{formatDateTime(incident.detectedAt)} UTC</Kv>
                <Kv label="Execution status">{incident.executionStatus}</Kv>
                <Kv label="Error code" mono>
                  {def.errorCode}
                </Kv>
              </div>
            </Step>

            <Step n={2} icon={BrainCircuit} title="AI investigation" state="done" summary={def.rootCause} defaultOpen>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Investigation process</p>
              <div className="mt-2">
                <Checklist items={def.analysisSteps} doneCount={def.analysisSteps.length} />
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Findings</p>
              <ul className="mt-2 space-y-1.5">
                {def.investigation.map((f, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-text-secondary">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-text-tertiary" />
                    {fill(f, ctx)}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary">
                <span className="font-semibold">Root cause: </span>
                {def.rootCause}
              </p>
            </Step>

            <Step n={3} icon={ShieldAlert} title="Failure type identified" state="done" summary={`${def.label} → ${def.recommendation}`} defaultOpen>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                <Kv label="Failure type">{def.label}</Kv>
                <Kv label="Classification code" mono>
                  {def.key}
                </Kv>
                <Kv label="Severity">{incident.severity}</Kv>
                <Kv label="Guardrail" mono>
                  {guardrailOf(incident)}
                </Kv>
                <Kv label="Guardrail decision" mono>
                  {guardrailDecision(incident)}
                </Kv>
                <Kv label="Recommended action" mono>
                  {def.recommendation}
                </Kv>
              </div>
              <p className="mt-3 text-xs text-text-tertiary">
                {def.autoRemediable ? "This failure type has an approved, reversible remediation — it runs after human approval." : "This failure type has no safe automated remediation — it is escalated to a human."}
              </p>
            </Step>

            <Step
              n={4}
              icon={Timer}
              title="SLA check"
              state="done"
              summary={incident.slaStatus === "CRITICAL" ? `Critical — ${slaGap} min over the ${SLA_BASELINE_MINUTES} min baseline` : `Safe — within the ${SLA_BASELINE_MINUTES} min baseline`}
              defaultOpen
            >
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                <Kv label="Average runtime (baseline)">{SLA_BASELINE_MINUTES} min</Kv>
                <Kv label="Actual runtime">{formatDuration(incident.durationMinutes)}</Kv>
                <Kv label="SLA status">
                  <StatusBadge style={SLA_STYLES[incident.slaStatus]} />
                </Kv>
              </div>
              <div className="relative mt-4 h-2.5 rounded-full bg-surface-muted" role="img" aria-label={`Runtime ${incident.durationMinutes} minutes against a ${SLA_BASELINE_MINUTES} minute baseline`}>
                <div className={cn("h-full rounded-full", incident.slaStatus === "CRITICAL" ? "bg-danger-500" : "bg-success-500")} style={{ width: `${(incident.durationMinutes / scaleMax) * 100}%` }} />
                <div className="absolute -top-1 h-4.5 w-0.5 bg-navy-950" style={{ left: `${(SLA_BASELINE_MINUTES / scaleMax) * 100}%` }} title={`${SLA_BASELINE_MINUTES} min baseline`} />
              </div>
              <p className="mt-2 text-xs text-text-tertiary">
                {incident.slaStatus === "CRITICAL"
                  ? `Runtime exceeded the ${SLA_BASELINE_MINUTES}-minute average by ${slaGap} minutes, so this incident is marked critical.`
                  : `Runtime was ${SLA_BASELINE_MINUTES - incident.durationMinutes} minutes under the ${SLA_BASELINE_MINUTES}-minute average, so the SLA is safe.`}
              </p>
            </Step>

            <Step
              n={5}
              icon={Wrench}
              title="Remediation"
              state={remState}
              summary={
                status === "WAITING_APPROVAL"
                  ? def.autoRemediable
                    ? `Waiting for approval — ${def.remediationLabel}`
                    : "Escalation required — no automated action"
                  : status === "ESCALATED"
                    ? "Escalated to the pipeline owner"
                    : status === "REMEDIATING"
                      ? "Running in Databricks"
                      : status === "RESOLVED"
                        ? def.autoRemediable
                          ? `${def.remediationLabel} completed`
                          : "Fixed by the pipeline owner"
                        : "Rejected — not executed"
              }
              defaultOpen
            >
              <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
                <Kv label="Approval" mono>
                  {approvalStatus(incident)}
                </Kv>
                <Kv label="Remediation" mono>
                  {remediationStatus(incident)}
                </Kv>
                <Kv label="Approved by">{incident.approvedBy ?? "—"}</Kv>
                <Kv label="Remediation run" mono>
                  {incident.remediationRunId ?? "—"}
                </Kv>
              </div>
              <Checklist items={remSteps} doneCount={remDone} activeIndex={remActive} />
              {def.change && (
                <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-secondary">
                  {def.change.label}: <span className="font-medium text-text-primary">{def.change.current}</span> <ArrowRight className="mx-1 inline size-3" /> <span className="font-medium text-text-primary">{def.change.recommended}</span>
                </p>
              )}
            </Step>

            <Step
              n={6}
              icon={Rocket}
              title="Validation"
              state={validationState}
              summary={closed ? "Passed — pipeline recovered" : status === "REMEDIATING" ? "Validating the new run…" : status === "REJECTED" ? "Skipped — remediation rejected" : "Pending remediation"}
              defaultOpen={closed || status === "REMEDIATING"}
            >
              <p className="mb-2 text-xs text-text-tertiary">
                Validation status: <span className="font-mono">{validationStatus(incident)}</span>
              </p>
              <Checklist items={def.validation} doneCount={closed ? def.validation.length : 0} activeIndex={status === "REMEDIATING" ? 0 : undefined} />
            </Step>

            <Step
              n={7}
              icon={Mail}
              title="Notification & escalation"
              state={emails.length > 0 ? "done" : "pending"}
              summary={emails.length > 0 ? `${emails.length} email${emails.length > 1 ? "s" : ""} sent to ${incident.owner.name}` : "No email sent yet"}
              defaultOpen={emails.length > 0}
            >
              {emails.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-text-secondary">The pipeline owner has not been emailed. The email — with reason and solution — is generated automatically.</p>
                  <Button size="sm" onClick={() => setModal("email")}>
                    <Mail className="size-3.5" />
                    Send email
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {emails.map((n) => (
                    <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">{n.subject}</p>
                        <p className="text-xs text-text-tertiary">
                          {n.kind} · {n.recipient.name} · {formatDateTime(n.sentAt)} UTC
                        </p>
                      </div>
                      <Link href={`/notifications/${n.id}`} className="text-xs font-medium text-accent-600 hover:text-accent-700">
                        View email
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Step>

            <Step
              n={8}
              icon={FlaskConical}
              title="Regression test suite"
              state={closed ? "done" : "pending"}
              summary={closed ? `REG-${incident.id} added to the CI/CD suite` : "Added to the CI/CD suite when the incident closes"}
              defaultOpen={closed}
              last
            >
              <div className="divide-y divide-border rounded-lg border border-border bg-surface">
                {[
                  ["Test ID", `REG-${incident.id}`],
                  ["Scenario", def.regression.scenario],
                  ["Expected behavior", def.regression.expectedBehavior],
                  ["Expected classification", `${def.label} (${def.key})`],
                  ["Expected workflow", def.regression.expectedWorkflow],
                  ["Expected remediation", `${def.recommendation} — ${def.remediationLabel}`],
                  ["Expected final state", def.autoRemediable ? "RESOLVED — validation passed" : "ESCALATED — resolved by the pipeline owner"],
                  ["Current state", closed ? `RESOLVED — ${formatDateTime(incident.resolvedAt)} UTC` : status.replaceAll("_", " ")],
                ].map(([label, value]) => (
                  <div key={label} className="grid gap-1 px-3.5 py-2.5 sm:grid-cols-[11rem_1fr]">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{label}</p>
                    <p className="text-sm text-text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </Step>
          </ol>
        </section>

        <AuditTimeline events={incident.audit} />
      </div>

      <EmailModal incident={incident} open={modal === "email"} onClose={() => setModal(null)} />
      <RemediationStartedModal info={started} onClose={() => setStarted(null)} />
      <Modal
        open={modal === "reject"}
        onClose={() => setModal(null)}
        title="Reject remediation"
        description="No action will be taken on this pipeline. The incident is closed as rejected."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                rejectIncident(incident.id);
                setModal(null);
              }}
            >
              Confirm rejection
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Reject the recommended <strong className="text-text-primary">{def.remediationLabel}</strong> for <strong className="text-text-primary">{incident.pipeline}</strong>?
        </p>
      </Modal>
    </div>
  );
}
