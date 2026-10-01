"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MOCK_INCIDENTS } from "@/data/mock/incidents";
import { USE_LIVE_API } from "@/lib/liveMode";
import {
  approveIncident,
  fetchActiveIncidents,
  fetchIncidentChecks,
  fetchIncidentDetail,
  fetchIncidentHistory,
  rejectIncident,
} from "@/services/liveApiService";
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

/**
 * Fetches the full detail (investigation text, guardrail/status fields) +
 * DQ/SLA checks and fully replaces the store entry with a fresh mapping —
 * used both for the initial per-incident hydration and after an
 * approve/reject action, so the UI always reflects the real current state.
 */
export async function refreshLiveIncident(incidentId: string): Promise<Incident | null> {
  const [detail, checks] = await Promise.all([fetchIncidentDetail(incidentId), fetchIncidentChecks(incidentId)]);
  if (!detail) return null;
  const incident = mapLiveIncidentDetailToIncident(detail, checks);
  store.set(incidentId, incident);
  emit();
  return incident;
}

/** On-demand, per-incident: fetches the full detail (investigation text) + DQ/SLA checks and merges them into the store entry. */
export async function hydrateIncidentChecks(incidentId: string): Promise<void> {
  if (!store.get(incidentId)) return;
  try {
    await refreshLiveIncident(incidentId);
  } catch {
    // best-effort — leave the list-level data as-is
  }
}

export interface IncidentActionResult {
  ok: boolean;
  message: string;
}

/** Records human approval and immediately starts the guardrail-gated remediation (a real Databricks job rerun). */
export async function approveLiveIncident(incidentId: string, approvedBy: string): Promise<IncidentActionResult> {
  try {
    const result = await approveIncident(incidentId, approvedBy);
    await refreshLiveIncident(incidentId);
    return { ok: result.success && result.result?.status !== "REJECTED", message: result.result?.message ?? "Incident approved." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Unable to approve this incident." };
  }
}

/** Records rejection. No Databricks job or pipeline is executed. */
export async function rejectLiveIncident(incidentId: string, rejectedBy: string): Promise<IncidentActionResult> {
  try {
    await rejectIncident(incidentId, rejectedBy);
    await refreshLiveIncident(incidentId);
    return { ok: true, message: "Incident rejected. No remediation was executed." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Unable to reject this incident." };
  }
}

export function useInitLiveIncidents(): void {
  useEffect(() => {
    initLiveIncidents();
  }, []);
}
