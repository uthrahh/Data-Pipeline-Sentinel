"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { IncidentFilters } from "@/components/incident/IncidentFilters";
import { IncidentsTable } from "@/components/incident/IncidentsTable";
import { useIncidents } from "@/hooks/useIncidents";
import type { IncidentFilters as IncidentFiltersType } from "@/types";

export default function IncidentsPage() {
  const [filters, setFilters] = useState<IncidentFiltersType>({});
  const { data, isLoading, error } = useIncidents(filters);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Incidents"
        description="Every pipeline failure, from detection through resolution."
      />

      <div className="p-4 sm:p-6">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <IncidentFilters filters={filters} onChange={setFilters} resultCount={data.total} />
          <IncidentsTable incidents={data.items} isLoading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}
