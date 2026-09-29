"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MOCK_INCIDENTS } from "@/data/mock/incidents";
import { USE_LIVE_API } from "@/lib/liveMode";
import { fetchActiveIncidents, fetchIncidentChecks, fetchIncidentDetail, fetchIncidentHistory } from "@/services/liveApiService";
import { mapLiveIncidentDetailToIncident, mapLiveIncidentToIncident } from "@/lib/mapLiveIncident";
import type { Incident } from "@/types";

/**
 * The one mutable source of truth for incident state — seeded from the
 * static mock fixtures normally, or (when USE_LIVE_API) replaced with real
 * incidents fetched from the ai-dataops-assistant API once initLiveIncidents()
 * runs. Both the incident detail page's own actions (DQ Breach's Run/Send
 * Email choice, mock mode only) and notificationStore.ts write through here,
 * so every view of an incident always agrees.
 */
const store = new Map<string, Incident>(USE_LIVE_API ? [] : MOCK_INCIDENTS.map((i) => [i.incidentId, i]));
const listeners = new Set<() => void>();

export type LoadStatus = "idle" | "loading" | "loaded" | "error";
let loadStatus: LoadStatus = USE_LIVE_API ? "idle" : "loaded";
let liveLoadStarted = false;

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

export function useIncidentsLoadStatus(): LoadStatus {
  return useSyncExternalStore(subscribe, () => loadStatus, () => loadStatus);
}

/**
 * Fetches real incidents (active + history, merged so an incident present
 * in both only counts once) from ai-dataops-assistant and replaces the
 * store's contents. Safe to call from multiple components mounting at
 * once — only the first call actually fetches.
 */
export async function initLiveIncidents(): Promise<void> {
  if (!USE_LIVE_API || liveLoadStarted) return;
  liveLoadStarted = true;
  loadStatus = "loading";
  emit();
  try {
    const [active, history] = await Promise.all([fetchActiveIncidents(), fetchIncidentHistory()]);
    const merged = new Map<string, Incident>();
    for (const row of history) merged.set(row.incident_id, mapLiveIncidentToIncident(row));
    for (const row of active) merged.set(row.incident_id, mapLiveIncidentToIncident(row)); // active is freshest
    store.clear();
    for (const [id, incident] of merged) store.set(id, incident);
    loadStatus = "loaded";
  } catch {
    loadStatus = "error";
  }
  emit();
}

/** On-demand, per-incident: fetches the full detail (investigation text) + DQ/SLA checks and merges them into the store entry. */
export async function hydrateIncidentChecks(incidentId: string): Promise<void> {
  const current = store.get(incidentId);
  if (!current) return;
  try {
    const [detail, checks] = await Promise.all([fetchIncidentDetail(incidentId), fetchIncidentChecks(incidentId)]);
    const enriched = detail ? mapLiveIncidentDetailToIncident(detail, checks) : { ...current, dq: current.dq, sla: current.sla };
    store.set(incidentId, { ...current, dq: enriched.dq, sla: enriched.sla });
    emit();
  } catch {
    // best-effort — leave the list-level data as-is
  }
}

export function useInitLiveIncidents(): void {
  useEffect(() => {
    initLiveIncidents();
  }, []);
}
