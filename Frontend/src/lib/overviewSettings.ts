"use client";

import { useEffect, useState } from "react";

/**
 * The knobs behind the Overview KPIs (items 3-5 of the overview spec):
 * average/max runtime baselines, and how many additional pipelines (beyond
 * the fixed set of incident examples every failure type needs) are marked
 * failed. Changing these recomputes pipeline durations, health scores, and
 * the Pipeline Success Rate KPI — see data/mock/pipelineSummaries.ts.
 *
 * Persisted to localStorage as a per-viewer convenience only (this is a
 * static site with no backend) — never assumed to be there, always falls
 * back to DEFAULT_OVERVIEW_SETTINGS.
 */
export interface OverviewSettings {
  avgRuntimeMinutes: number;
  maxRuntimeMinutes: number;
  /** Additional pipelines (beyond the fixed failure-type examples) marked failed, 0-5. */
  extraFailureCount: number;
}

export const DEFAULT_OVERVIEW_SETTINGS: OverviewSettings = {
  avgRuntimeMinutes: 12,
  maxRuntimeMinutes: 25,
  extraFailureCount: 2,
};

const STORAGE_KEY = "sentinel.overviewSettings.v1";

function readStored(): OverviewSettings {
  if (typeof window === "undefined") return DEFAULT_OVERVIEW_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_OVERVIEW_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_OVERVIEW_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_OVERVIEW_SETTINGS;
  }
}

export function useOverviewSettings() {
  const [settings, setSettings] = useState<OverviewSettings>(DEFAULT_OVERVIEW_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage only after mount, so the first client render matches
  // the server-rendered (default-settings) HTML — avoids a hydration mismatch.
  useEffect(() => {
    setSettings(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // best-effort only
    }
  }, [settings, hydrated]);

  return { settings, setSettings };
}
