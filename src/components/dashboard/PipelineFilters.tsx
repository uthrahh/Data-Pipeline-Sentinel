"use client";

import { Search } from "lucide-react";
import type { PipelineExecutionFilters } from "@/types";
import { FilterMenu } from "@/components/common/FilterMenu";
import { COUNTRIES, PIPELINES } from "@/config/sapPipelineConfig";

const STATUS_OPTIONS = [
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "RUNNING", label: "Running" },
  { value: "TIMED_OUT", label: "Timed Out" },
  { value: "PARTIAL", label: "Partial" },
  { value: "UNKNOWN", label: "Unknown" },
];

const TRIGGER_OPTIONS = [
  { value: "Scheduled", label: "Scheduled" },
  { value: "Manual", label: "Manual" },
  { value: "Event", label: "Event" },
  { value: "Dependency", label: "Dependency" },
];

const PIPELINE_OPTIONS = PIPELINES.map((p) => ({ value: p.id, label: p.label }));
const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: `${c.label} (${c.code})` }));

interface PipelineFiltersProps {
  filters: PipelineExecutionFilters;
  onChange: (filters: PipelineExecutionFilters) => void;
  resultCount?: number;
}

export function PipelineFilters({ filters, onChange, resultCount }: PipelineFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3 sm:px-5">
      <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border-strong bg-surface-subtle px-3">
        <Search className="size-3.5 shrink-0 text-text-tertiary" />
        <input
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search pipelines, triggers, execution IDs…"
          className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>

      <FilterMenu
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status ?? []}
        onChange={(v) => onChange({ ...filters, status: v as PipelineExecutionFilters["status"] })}
      />
      <FilterMenu
        label="Pipeline"
        options={PIPELINE_OPTIONS}
        selected={filters.pipelineId ?? []}
        onChange={(v) => onChange({ ...filters, pipelineId: v as PipelineExecutionFilters["pipelineId"] })}
      />
      <FilterMenu
        label="Country"
        options={COUNTRY_OPTIONS}
        selected={filters.country ?? []}
        onChange={(v) => onChange({ ...filters, country: v as PipelineExecutionFilters["country"] })}
      />
      <FilterMenu
        label="Trigger"
        options={TRIGGER_OPTIONS}
        selected={filters.triggerType ?? []}
        onChange={(v) => onChange({ ...filters, triggerType: v as PipelineExecutionFilters["triggerType"] })}
      />

      <label className="ml-1 flex items-center gap-1.5 text-xs text-text-secondary">
        <input
          type="checkbox"
          checked={filters.excludeManualTriggers ?? false}
          onChange={(e) => onChange({ ...filters, excludeManualTriggers: e.target.checked })}
          className="size-3.5 rounded border-border-strong accent-[--color-accent-500]"
        />
        Exclude manual triggers
      </label>

      {resultCount !== undefined && (
        <span className="ml-auto text-xs text-text-tertiary">
          <span className="font-medium text-text-secondary">{resultCount}</span> results
        </span>
      )}
    </div>
  );
}
