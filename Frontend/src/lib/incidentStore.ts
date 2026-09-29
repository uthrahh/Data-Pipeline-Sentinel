"use client";

import { useSyncExternalStore } from "react";
import { MOCK_INCIDENTS } from "@/data/mock/incidents";
import type { Incident } from "@/types";

/**
 * The one mutable source of truth for incident state on this static site —
 * no backend, so "state" is just an in-memory store seeded from the mock
 * fixtures. Both the incident detail page's own actions (DQ Breach's
 * Run/Send Email choice) and notificationStore.ts (sending/rejecting a
 * drafted notification closes the incident it came from) write through here,
 * so every view of an incident always agrees.
 */
const store = new Map<string, Incident>(MOCK_INCIDENTS.map((i) => [i.incidentId, i]));
const listeners = new Set<() => void>();

// useSyncExternalStore requires getSnapshot to return a stable (===) value
// when nothing has changed, or React re-renders forever. Array.from(...) on
// every call would return a new array each time, so the list snapshot is
// cached and only rebuilt when the store actually changes.
let cachedList: Incident[] | null = null;

function emit() {
  cachedList = null;
  listeners.forEach((l) => l());
}

export function getIncidentSnapshot(incidentId: string): Incident | undefined {
  return store.get(incidentId);
}

export function getAllIncidentsSnapshot(): Incident[] {
  if (!cachedList) cachedList = Array.from(store.values());
  return cachedList;
}

export function updateIncident(incidentId: string, patch: Partial<Incident>) {
  const current = store.get(incidentId);
  if (!current) return;
  store.set(incidentId, { ...current, ...patch });
  emit();
}

/**
 * The Data Quality Breach "Run / Remediate" choice: rerun despite the known
 * DQ issue. Per spec this always lands on SUCCESS - PARTIAL (never a clean
 * RESOLVED) — the pipeline did complete, but the DQ issue that triggered
 * the incident is recorded, not silently dropped.
 */
export function runDataQualityRemediation(incidentId: string, now: string = new Date().toISOString()) {
  const current = store.get(incidentId);
  if (!current) return;
  store.set(incidentId, {
    ...current,
    status: "SUCCESS_PARTIAL",
    remediation: {
      remediationRunId: `${current.pipelineRunId}-rerun`,
      originalRunId: current.pipelineRunId,
      startedAt: now,
      completedAt: now,
      status: "SUCCESS",
      error: null,
    },
    postValidation: { dqStatus: current.dq?.status === "COMPLETE" ? "FAIL" : "NOT_AVAILABLE", slaStatus: current.sla?.status ?? "NOT_AVAILABLE", overallStatus: "FAIL" },
    finalMessage: "Ran despite the known data quality issue — marked Success - Partial; DQ issue recorded for downstream consumers.",
    audit: [
      ...current.audit,
      { id: `run-${now}`, timestamp: now, label: "User selected Run", actor: "human", detail: "Ran despite the known data quality issue." },
      { id: `partial-${now}`, timestamp: now, label: "Completed — marked Success - Partial", actor: "system", detail: "DQ issue recorded; downstream consumers should be aware." },
    ],
  });
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIncidentFromStore(incidentId: string): Incident | undefined {
  return useSyncExternalStore(
    subscribe,
    () => getIncidentSnapshot(incidentId),
    () => getIncidentSnapshot(incidentId),
  );
}

export function useAllIncidentsFromStore(): Incident[] {
  return useSyncExternalStore(subscribe, getAllIncidentsSnapshot, getAllIncidentsSnapshot);
}
