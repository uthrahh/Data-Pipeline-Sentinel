"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { incidentService } from "@/services/incidentService";
import type { Incident, IncidentStatus } from "@/types";

const TRANSITIONAL_STATUSES: IncidentStatus[] = ["APPROVED", "REMEDIATING", "VALIDATING"];
const POLL_INTERVAL_MS = 1500;

/**
 * Loads an incident and, while it is mid-lifecycle (approved / remediating /
 * validating), polls for updates so the UI reflects the simulated backend
 * state machine. A real backend would replace the poll with SSE/WebSocket
 * push — the hook's public shape would stay the same.
 */
export function useIncident(incidentId: string) {
  const [data, setData] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchIncident = useCallback(async () => {
    try {
      const res = await incidentService.getIncident(incidentId);
      if (!res) {
        setNotFound(true);
      } else {
        setData(res);
      }
      setError(null);
      return res;
    } catch {
      setError("Unable to load this incident.");
      return null;
    }
  }, [incidentId]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: show loading state when incidentId changes
    setIsLoading(true);
    setNotFound(false);
    fetchIncident().finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetchIncident]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (data && TRANSITIONAL_STATUSES.includes(data.status)) {
      pollRef.current = setInterval(fetchIncident, POLL_INTERVAL_MS);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data?.status, fetchIncident, data]);

  const approve = useCallback(
    async (decidedBy: string) => {
      setIsSubmittingAction(true);
      setActionError(null);
      try {
        const updated = await incidentService.approveIncident(incidentId, decidedBy);
        setData(updated);
      } catch {
        setActionError("Unable to approve this remediation. Please try again.");
      } finally {
        setIsSubmittingAction(false);
      }
    },
    [incidentId],
  );

  const reject = useCallback(
    async (decidedBy: string, reason: string) => {
      setIsSubmittingAction(true);
      setActionError(null);
      try {
        const updated = await incidentService.rejectIncident(incidentId, decidedBy, reason);
        setData(updated);
      } catch {
        setActionError("Unable to reject this recommendation. Please try again.");
      } finally {
        setIsSubmittingAction(false);
      }
    },
    [incidentId],
  );

  return { data, isLoading, error, notFound, approve, reject, isSubmittingAction, actionError };
}
