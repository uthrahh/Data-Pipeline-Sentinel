"use client";

import { useEffect, useState } from "react";
import { incidentService } from "@/services/incidentService";
import type { Incident, IncidentFilters, Paginated } from "@/types";

const EMPTY: Paginated<Incident> = { items: [], total: 0, page: 1, pageSize: 0 };

export function useIncidents(filters: IncidentFilters = {}) {
  const [data, setData] = useState<Paginated<Incident>>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show loading state on refetch when filters change
    setIsLoading(true);
    setError(null);
    incidentService
      .getIncidents(filters)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load incidents.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, isLoading, error };
}
