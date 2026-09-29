"use client";

import { useSyncExternalStore } from "react";
import { MOCK_NOTIFICATIONS } from "@/data/mock/notifications";
import { updateIncident, getIncidentSnapshot } from "@/lib/incidentStore";
import { formatRecipient } from "@/data/mock/people";
import type { Incident, Notification, NotificationReason } from "@/types";

/**
 * Mutable in-memory store for notifications — same pattern as
 * incidentStore.ts. Sending or rejecting a notification also closes out the
 * incident it was drafted from (WAITING_APPROVAL -> FAILED or REJECTED), per
 * the spec: nothing is ever actually delivered, this only simulates it.
 */
const store = new Map<string, Notification>(MOCK_NOTIFICATIONS.map((n) => [n.id, n]));
const listeners = new Set<() => void>();

// See incidentStore.ts's identical comment: useSyncExternalStore needs a
// stable (===) snapshot reference when nothing changed, so the sorted list
// is cached and only rebuilt on an actual mutation.
let cachedList: Notification[] | null = null;

function emit() {
  cachedList = null;
  listeners.forEach((l) => l());
}

function nowIso() {
  return new Date().toISOString();
}

export function getNotificationSnapshot(id: string): Notification | undefined {
  return store.get(id);
}

export function getAllNotificationsSnapshot(): Notification[] {
  if (!cachedList) cachedList = Array.from(store.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return cachedList;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotificationFromStore(id: string): Notification | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getNotificationSnapshot(id),
    () => getNotificationSnapshot(id),
  );
}

export function useAllNotificationsFromStore(): Notification[] {
  return useSyncExternalStore(subscribe, getAllNotificationsSnapshot, getAllNotificationsSnapshot);
}

/** Creates a fresh, editable draft notification from an incident (e.g. the DQ Breach "Send Email" choice). */
export function createNotificationFromIncident(
  incident: Incident,
  reason: NotificationReason,
  overrides: Partial<Pick<Notification, "subject" | "messageContent">> = {},
): Notification {
  const id = `NOTIF-${incident.incidentId}-${Date.now().toString(36).toUpperCase()}`;
  const notification: Notification = {
    id,
    incidentId: incident.incidentId,
    pipelineName: incident.pipelineName,
    country: incident.country ?? "",
    reason,
    issueDetails: incident.failure.errorMessage,
    investigationSummary: incident.investigation?.rootCause ?? "",
    dq: incident.dq,
    sla: incident.sla,
    recommendation: incident.recommendation?.action ?? "",
    subject: overrides.subject ?? `[Sentinel] ${incident.pipelineName} — ${incident.failure.errorMessage}`,
    messageContent:
      overrides.messageContent ??
      `Incident ${incident.incidentId}: ${incident.failure.errorMessage}\n\n${
        incident.investigation ? `Investigation: ${incident.investigation.rootCause}\n\n` : ""
      }Recommended action: ${incident.recommendation?.action ?? "See incident detail."}`,
    recipient: formatRecipient(incident.assignee),
    status: "WAITING_APPROVAL",
    createdAt: nowIso(),
    sentAt: null,
    approvedBy: null,
  };
  store.set(id, notification);
  updateIncident(incident.incidentId, { notificationId: id });
  emit();
  return notification;
}

export function updateNotificationContent(id: string, patch: Partial<Pick<Notification, "messageContent" | "subject" | "recipient">>) {
  const current = store.get(id);
  if (!current) return;
  store.set(id, { ...current, ...patch });
  emit();
}

export function sendNotification(id: string, approvedBy: string) {
  const current = store.get(id);
  if (!current) return;
  store.set(id, { ...current, status: "SENT", sentAt: nowIso(), approvedBy });
  if (current.incidentId) {
    const incident = getIncidentSnapshot(current.incidentId);
    if (incident) {
      updateIncident(current.incidentId, {
        status: "FAILED",
        approval: { requestedAt: current.createdAt, decidedAt: nowIso(), decidedBy: approvedBy, decision: "APPROVED", rejectionReason: null },
      });
    }
  }
  emit();
}

export function rejectNotification(id: string, rejectedBy: string) {
  const current = store.get(id);
  if (!current) return;
  store.set(id, { ...current, status: "REJECTED", approvedBy: rejectedBy });
  if (current.incidentId) {
    const incident = getIncidentSnapshot(current.incidentId);
    if (incident) {
      updateIncident(current.incidentId, {
        status: "REJECTED",
        approval: { requestedAt: current.createdAt, decidedAt: nowIso(), decidedBy: rejectedBy, decision: "REJECTED", rejectionReason: "Declined from the Notification tab." },
      });
    }
  }
  emit();
}
