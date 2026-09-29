"use client";

import { useEffect, useState } from "react";
import { fetchDashboard } from "@/services/liveApiService";
import type { LiveDashboard } from "@/types";

/** One real fetch to ai-dataops-assistant's /api/dashboard: pipeline operations + active incidents + incident history together. */
export function useLiveDashboard() {
  const [data, setData] = useState<LiveDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboard()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load live dashboard data from ai-dataops-assistant.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, isLoading, error };
}
