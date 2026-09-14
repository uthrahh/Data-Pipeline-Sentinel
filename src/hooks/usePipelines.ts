"use client";

import { useEffect, useState } from "react";
import { pipelineService } from "@/services/pipelineService";
import type { Paginated, PipelineExecution, PipelineExecutionQuery } from "@/types";

const EMPTY: Paginated<PipelineExecution> = { items: [], total: 0, page: 1, pageSize: 10 };

export function usePipelines(query: PipelineExecutionQuery) {
  const [data, setData] = useState<Paginated<PipelineExecution>>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show loading state on refetch when filters/sort/page change
    setIsLoading(true);
    setError(null);
    pipelineService
      .getExecutions(query)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load pipeline executions.");
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
