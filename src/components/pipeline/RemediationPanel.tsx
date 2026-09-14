"use client";

import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import type { Remediation } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { REMEDIATION_STATUS_STYLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

function useElapsedSeconds(startIso: string, running: boolean): number {
  const [elapsed, setElapsed] = useState(() => Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000)));

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [startIso, running]);

  return elapsed;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function RemediationPanel({ remediation }: { remediation: Remediation }) {
  const running = remediation.status === "RUNNING";
  const elapsed = useElapsedSeconds(remediation.startedAt, running);

  return (
    <Card>
      <CardHeader
        title="Remediation"
        icon={<Wrench className="size-4" />}
        action={<StatusBadge style={REMEDIATION_STATUS_STYLES[remediation.status]} pulse={running} />}
      />
      <CardBody>
        {running && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-info-50 px-3.5 py-2.5 text-info-700">
            <span className="size-2 animate-pulse-dot rounded-full bg-info-500" />
            <p className="text-xs font-medium">Remediation in progress — running for {formatElapsed(elapsed)}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Original Run</p>
            <p className="mt-1 font-mono text-xs font-medium text-text-primary">{remediation.originalRunId}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Remediation Run</p>
            <p className="mt-1 font-mono text-xs font-medium text-text-primary">{remediation.remediationRunId}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">Started At</p>
            <p className="mt-1 text-sm font-medium text-text-primary">{formatDateTime(remediation.startedAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
              {remediation.status === "SUCCESS" || remediation.status === "FAILED" ? "Completed At" : "Current Runtime"}
            </p>
            <p className="mt-1 text-sm font-medium text-text-primary">
              {remediation.completedAt ? formatDateTime(remediation.completedAt) : formatElapsed(elapsed)}
            </p>
          </div>
        </div>

        {remediation.status === "FAILED" && remediation.error && (
          <div className="mt-4 rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-danger-700">Remediation Error</p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-danger-700">{remediation.error}</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
