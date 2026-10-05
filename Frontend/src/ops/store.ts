"use client";

import { useSyncExternalStore } from "react";
import { WORKSPACES, type WorkspaceId } from "./catalog";
import { SEED_INCIDENTS, SEED_NOTIFICATIONS, SEED_RUNS } from "./data";
import { buildEmail } from "./email";
import { FAILURE_BY_KEY } from "./failureTypes";
import type { AppNotification, AuditEvent, Incident, PipelineRun } from "./types";

export interface OpsState {
  workspace: WorkspaceId;
  incidents: Incident[];
  notifications: AppNotification[];
  runs: PipelineRun[];
}

/** The signed-in demo user — recorded as the approver / sender on actions. */
export const CURRENT_USER = "Sentinel Operator";

/** How long a started remediation "runs" in Databricks before it validates and resolves. */
const REMEDIATION_MS = 7000;

let state: OpsState = {
  workspace: "all",
  incidents: SEED_INCIDENTS,
  notifications: SEED_NOTIFICATIONS,
  runs: SEED_RUNS,
};

const listeners = new Set<() => void>();
let counter = 0;

function set(next: Partial<OpsState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useOps(): OpsState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function setWorkspace(id: WorkspaceId) {
  if (WORKSPACES.some((w) => w.id === id)) set({ workspace: id });
}

/**
 * Live action timestamps: the demo data is a fixed window, so a live click is
 * stamped no earlier than one minute after the incident's latest event —
 * keeping the audit trail in order whatever the viewer's clock says.
 */
function stamp(i: Incident): string {
  const last = i.audit.reduce((m, e) => Math.max(m, Date.parse(e.timestamp)), Date.parse(i.detectedAt));
  return new Date(Math.max(Date.now(), last + 60000)).toISOString();
}

function newEventId(incidentId: string): string {
  counter += 1;
  return `${incidentId}-live-${counter}`;
}

function patchIncident(id: string, fn: (i: Incident) => Incident) {
  set({ incidents: state.incidents.map((i) => (i.id === id ? fn(i) : i)) });
}

function withEvent(i: Incident, e: Omit<AuditEvent, "id">): Incident {
  return { ...i, audit: [...i.audit, { ...e, id: newEventId(i.id) }] };
}

function randomRunId(): string {
  let id = String(1 + Math.floor(Math.random() * 9));
  for (let k = 0; k < 14; k += 1) id += String(Math.floor(Math.random() * 10));
  return id;
}

export interface RemediationStart {
  incidentId: string;
  pipeline: string;
  remediationRunId: string;
  action: string;
  startedAt: string;
}

/** Approve: starts the remediation in "Databricks" (simulated), then validates and resolves it. */
export function approveAndRemediate(id: string): RemediationStart | null {
  const incident = state.incidents.find((i) => i.id === id);
  if (!incident || incident.status !== "WAITING_APPROVAL") return null;
  const def = FAILURE_BY_KEY[incident.failureKey];
  if (!def.autoRemediable) return null;

  const startedAt = stamp(incident);
  const remediationRunId = randomRunId();

  patchIncident(id, (i) => {
    let next: Incident = {
      ...i,
      status: "REMEDIATING",
      approvedBy: CURRENT_USER,
      approvedAt: startedAt,
      remediationRunId,
      remediationStartedAt: startedAt,
    };
    next = withEvent(next, { timestamp: startedAt, label: "Remediation approved", actor: "human", detail: `By ${CURRENT_USER}` });
    next = withEvent(next, { timestamp: startedAt, label: `Remediation started: ${def.remediationLabel}`, actor: "system", detail: `Pipeline started in Databricks — run ${remediationRunId}` });
    return next;
  });

  setTimeout(() => {
    patchIncident(id, (i) => {
      if (i.status !== "REMEDIATING") return i;
      const done = stamp(i);
      let next: Incident = { ...i, status: "RESOLVED", resolvedAt: done };
      next = withEvent(next, { timestamp: done, label: "Validation passed — incident resolved", actor: "system", detail: def.validation[0] });
      return next;
    });
  }, REMEDIATION_MS);

  return { incidentId: id, pipeline: incident.pipeline, remediationRunId, action: def.remediationLabel, startedAt };
}

export function rejectIncident(id: string) {
  const incident = state.incidents.find((i) => i.id === id);
  if (!incident || (incident.status !== "WAITING_APPROVAL" && incident.status !== "ESCALATED")) return;
  const ts = stamp(incident);
  patchIncident(id, (i) => withEvent({ ...i, status: "REJECTED", rejectedBy: CURRENT_USER }, { timestamp: ts, label: "Remediation rejected", actor: "human", detail: `By ${CURRENT_USER}` }));
}

/** Sends the auto-generated email (escalation) to the pipeline's owner and records it in Notifications. */
export function sendEmail(id: string): AppNotification | null {
  const incident = state.incidents.find((i) => i.id === id);
  if (!incident) return null;
  const def = FAILURE_BY_KEY[incident.failureKey];
  const draft = buildEmail(incident);
  const sentAt = stamp(incident);
  const kind: AppNotification["kind"] = !def.autoRemediable || incident.severity === "CRITICAL" ? "Escalation" : "Email";

  counter += 1;
  const notification: AppNotification = {
    id: `NTF-${2000 + counter}`,
    incidentId: id,
    kind,
    subject: draft.subject,
    reason: draft.reason,
    recipient: incident.owner,
    cc: draft.cc,
    failureKey: incident.failureKey,
    pipeline: incident.pipeline,
    sentAt,
    sentBy: CURRENT_USER,
    body: draft.body,
    resolution: draft.resolution,
  };

  set({ notifications: [notification, ...state.notifications] });
  patchIncident(id, (i) => {
    const escalate = !def.autoRemediable && i.status === "WAITING_APPROVAL";
    return withEvent(
      { ...i, emailSent: true, status: escalate ? "ESCALATED" : i.status },
      { timestamp: sentAt, label: kind === "Escalation" ? "Escalation email sent" : "Email sent", actor: "human", detail: `To ${incident.owner.name} <${incident.owner.email}>` },
    );
  });
  return notification;
}
