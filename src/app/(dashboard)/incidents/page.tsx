"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { IncidentFilters } from "@/components/incident/IncidentFilters";
import { IncidentsTable } from "@/components/incident/IncidentsTable";
import { EmptyState } from "@/components/common/EmptyState";
import { useIncidents } from "@/hooks/useIncidents";
import type { IncidentFilters as IncidentFiltersType } from "@/types";
import { USE_LIVE_API } from "@/lib/liveMode";
import { ShieldAlert } from "lucide-react";

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
          {USE_LIVE_API ? (
            <EmptyState
              icon={ShieldAlert}
              title="Live incident data isn't available yet"
              description="This page's data comes from ai_dataops_poc.dataops.agent_incidents via GET /api/incidents/active — that requires a USE CATALOG grant on ai_dataops_poc that hasn't been applied yet. Fictional demo incidents aren't shown here in live mode to avoid mixing them with the real pipelines shown elsewhere in the app."
              className="py-16"
            />
          ) : (
            <>
              <IncidentFilters filters={filters} onChange={setFilters} resultCount={data.total} />
              <IncidentsTable incidents={data.items} isLoading={isLoading} error={error} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
