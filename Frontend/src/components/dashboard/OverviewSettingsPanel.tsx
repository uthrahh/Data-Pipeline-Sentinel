"use client";

import { useState } from "react";
import { Settings2, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import type { OverviewSettings } from "@/lib/overviewSettings";

interface OverviewSettingsPanelProps {
  settings: OverviewSettings;
  onChange: (settings: OverviewSettings) => void;
}

/**
 * The "changeable" knobs behind items 3-5 of the overview spec: average/max
 * runtime baselines (which drive health scores and the duration KPIs) and
 * how many additional pipelines are marked failed (which drives the Failed
 * Pipelines / Success Rate KPIs). Persisted per-viewer via overviewSettings.ts.
 */
export function OverviewSettingsPanel({ settings, onChange }: OverviewSettingsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen((o) => !o)}>
        <Settings2 className="size-3.5" />
        Runtime settings
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-surface p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Overview settings</p>
            <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-primary" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>

          <label className="mb-3 block text-xs font-medium text-text-secondary">
            Average runtime baseline (minutes)
            <input
              type="number"
              min={1}
              value={settings.avgRuntimeMinutes}
              onChange={(e) => onChange({ ...settings, avgRuntimeMinutes: Math.max(1, Number(e.target.value) || 1) })}
              className="mt-1 w-full rounded-md border border-border-strong bg-surface-subtle px-2.5 py-1.5 text-sm text-text-primary outline-none focus:border-accent-500"
            />
          </label>

          <label className="mb-3 block text-xs font-medium text-text-secondary">
            Max runtime ceiling (minutes)
            <input
              type="number"
              min={settings.avgRuntimeMinutes + 1}
              value={settings.maxRuntimeMinutes}
              onChange={(e) => onChange({ ...settings, maxRuntimeMinutes: Math.max(settings.avgRuntimeMinutes + 1, Number(e.target.value) || settings.avgRuntimeMinutes + 1) })}
              className="mt-1 w-full rounded-md border border-border-strong bg-surface-subtle px-2.5 py-1.5 text-sm text-text-primary outline-none focus:border-accent-500"
            />
          </label>

          <label className="block text-xs font-medium text-text-secondary">
            Extra failed pipelines (0-5)
            <input
              type="number"
              min={0}
              max={5}
              value={settings.extraFailureCount}
              onChange={(e) => onChange({ ...settings, extraFailureCount: Math.min(5, Math.max(0, Number(e.target.value) || 0)) })}
              className="mt-1 w-full rounded-md border border-border-strong bg-surface-subtle px-2.5 py-1.5 text-sm text-text-primary outline-none focus:border-accent-500"
            />
          </label>
          <p className="mt-2 text-[11px] text-text-tertiary">
            On top of the fixed worked examples (one per failure type). Recomputes health scores, KPIs, and which pipelines need optimization.
          </p>
        </div>
      )}
    </div>
  );
}
