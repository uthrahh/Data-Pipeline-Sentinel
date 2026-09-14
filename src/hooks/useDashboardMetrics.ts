"use client";

import { useEffect, useState } from "react";
import { metricsService } from "@/services/metricsService";
import type { DashboardMetrics } from "@/types";

export function useDashboardMetrics() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show loading state on manual refresh
    setIsLoading(true);
    setError(null);
    metricsService
      .getDashboardMetrics()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load dashboard metrics.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { data, isLoading, error, refresh: () => setRefreshKey((k) => k + 1) };
}
