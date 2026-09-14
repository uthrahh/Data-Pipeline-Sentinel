import { BrainCircuit, ListChecks } from "lucide-react";
import type { Investigation } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { LoadingState } from "@/components/common/LoadingState";
import { cn } from "@/lib/utils";

function ConfidenceMeter({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-success-500" : pct >= 60 ? "bg-warning-500" : "bg-danger-500";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-muted">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-text-primary">{pct}%</span>
    </div>
  );
}

export function InvestigationPanel({ investigation }: { investigation: Investigation }) {
  return (
    <Card>
      <CardHeader
        title="AI Investigation"
        icon={<BrainCircuit className="size-4" />}
        description="Automated root-cause analysis"
      />
      <CardBody>
        {investigation.status === "PENDING" ? (
          <LoadingState label="Investigation in progress — analyzing cluster logs, run metadata, and prior incidents…" />
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Likely Root Cause</p>
              <p className="mt-1.5 text-sm leading-relaxed text-text-primary">{investigation.rootCause}</p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Confidence</p>
                <div className="mt-1.5">
                  <ConfidenceMeter pct={investigation.confidencePct} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Pattern</p>
                <p className="mt-1.5 text-sm font-medium text-text-primary">
                  {investigation.transientOrSystemic === "SYSTEMIC" ? "Systemic — recurring signature" : "Transient — one-off occurrence"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Impact</p>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{investigation.impact}</p>
            </div>

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                <ListChecks className="size-3.5" />
                Evidence
              </p>
              <ul className="space-y-1.5">
                {investigation.evidence.map((e, i) => (
                  <li key={i} className="flex gap-2 text-sm text-text-secondary">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-text-tertiary" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-accent-500/20 bg-accent-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-700">Recommended Action</p>
              <p className="mt-1 text-sm font-medium text-accent-700">{investigation.recommendedAction}</p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
