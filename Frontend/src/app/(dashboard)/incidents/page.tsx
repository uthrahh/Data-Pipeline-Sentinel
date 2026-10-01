"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { IncidentFilters } from "@/components/incident/IncidentFilters";
import { IncidentsTable } from "@/components/incident/IncidentsTable";
import { useAllIncidentsFromStore, useIncidentsLoadStatus, useInitLiveIncidents } from "@/lib/incidentStore";
import { USE_LIVE_API } from "@/lib/liveMode";
import type { IncidentFilters as IncidentFiltersType } from "@/types";

export default function IncidentsPage() {
  useInitLiveIncidents();
  const [filters, setFilters] = useState<IncidentFiltersType>({});
  const allIncidents = useAllIncidentsFromStore();
  const loadStatus = useIncidentsLoadStatus();

  const filtered = useMemo(() => {
    let items = [...allIncidents].sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (i) => i.pipelineName.toLowerCase().includes(q) || i.incidentId.toLowerCase().includes(q) || i.failure.errorMessage.toLowerCase().includes(q),
      );
    }
    if (filters.status && filters.status.length > 0) items = items.filter((i) => filters.status!.includes(i.status));
    if (filters.severity && filters.severity.length > 0) items = items.filter((i) => filters.severity!.includes(i.severity));
    if (filters.country && filters.country.length > 0) items = items.filter((i) => i.country !== undefined && filters.country!.includes(i.country));
    return items;
  }, [allIncidents, filters]);

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Incidents"
        description={
          USE_LIVE_API
            ? "Every pipeline incident, from detection through resolution."
            : "Every pipeline failure, from detection through resolution — all 6 failure types."
        }
      />

      <div className="p-4 sm:p-6">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <IncidentFilters filters={filters} onChange={setFilters} resultCount={filtered.length} />
          <IncidentsTable incidents={filtered} isLoading={loadStatus === "loading"} error={loadStatus === "error" ? "Unable to load live incidents." : null} />
        </div>
      </div>
    </div>
  );
}
