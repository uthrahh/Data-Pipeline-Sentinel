"use client";

import { useEffect, useState } from "react";
import { pipelineService } from "@/services/pipelineService";
import type { PipelineExecution } from "@/types";

export function usePipeline(runId: string) {
  const [data, setData] = useState<PipelineExecution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show loading state when runId changes
    setIsLoading(true);
    setError(null);
    setNotFound(false);
    pipelineService
      .getExecution(runId)
      .then((res) => {
        if (cancelled) return;
        if (!res) setNotFound(true);
        setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load this pipeline execution.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  return { data, isLoading, error, notFound };
}
