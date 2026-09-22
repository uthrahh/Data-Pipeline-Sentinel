"use client";

import { Search } from "lucide-react";
import type { IncidentFilters as IncidentFiltersType } from "@/types";
import { FilterMenu } from "@/components/common/FilterMenu";
import { COUNTRIES } from "@/config/sapPipelineConfig";

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "INVESTIGATING", label: "Investigating" },
  { value: "WAITING_APPROVAL", label: "Waiting Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REMEDIATING", label: "Remediating" },
  { value: "REMEDIATION_FAILED", label: "Remediation Failed" },
  { value: "VALIDATING", label: "Validating" },
  { value: "VALIDATION_FAILED", label: "Validation Failed" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

const SEVERITY_OPTIONS = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: `${c.label} (${c.code})` }));

export function IncidentFilters({
  filters,
  onChange,
  resultCount,
}: {
  filters: IncidentFiltersType;
  onChange: (filters: IncidentFiltersType) => void;
  resultCount?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-4 py-3 sm:px-5">
      <div className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-border-strong bg-surface-subtle px-3">
        <Search className="size-3.5 shrink-0 text-text-tertiary" />
        <input
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search incidents, pipelines, error messages…"
          className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>
      <FilterMenu
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status ?? []}
        onChange={(v) => onChange({ ...filters, status: v as IncidentFiltersType["status"] })}
      />
      <FilterMenu
        label="Severity"
        options={SEVERITY_OPTIONS}
        selected={filters.severity ?? []}
        onChange={(v) => onChange({ ...filters, severity: v as IncidentFiltersType["severity"] })}
      />
      <FilterMenu
        label="Country"
        options={COUNTRY_OPTIONS}
        selected={filters.country ?? []}
        onChange={(v) => onChange({ ...filters, country: v as IncidentFiltersType["country"] })}
      />
      {resultCount !== undefined && (
        <span className="ml-auto text-xs text-text-tertiary">
          <span className="font-medium text-text-secondary">{resultCount}</span> results
        </span>
      )}
    </div>
  );
}
