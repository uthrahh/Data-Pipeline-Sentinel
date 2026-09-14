import { Sparkles } from "lucide-react";
import type { Recommendation } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RISK_STYLES } from "@/lib/constants";

export function RecommendationPanel({ recommendation }: { recommendation: Recommendation }) {
  return (
    <Card>
      <CardHeader
        title="AI Recommended Remediation"
        icon={<Sparkles className="size-4" />}
        action={<StatusBadge style={RISK_STYLES[recommendation.risk]} />}
      />
      <CardBody className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Recommended Action</p>
          <p className="mt-1.5 text-sm font-semibold text-text-primary">{recommendation.action}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Reason</p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{recommendation.reason}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Expected Outcome</p>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{recommendation.expectedOutcome}</p>
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Confidence</span>
          <span className="text-sm font-semibold text-text-primary">{recommendation.confidencePct}%</span>
        </div>
      </CardBody>
    </Card>
  );
}
