"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import type { Incident } from "@/types";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { RISK_STYLES, CURRENT_USER } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface HumanDecisionPanelProps {
  incident: Incident;
  onApprove: (decidedBy: string) => void;
  onReject: (decidedBy: string, reason: string) => void;
  isSubmitting: boolean;
  actionError: string | null;
}

/**
 * The human-in-the-loop decision point: AI has investigated and validated,
 * now a person decides whether it may act. This is the only place an
 * incident's remediation gets authorized — nothing executes without it.
 */
export function HumanDecisionPanel({ incident, onApprove, onReject, isSubmitting, actionError }: HumanDecisionPanelProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  const { recommendation, approval } = incident;
  if (!approval || !recommendation) return null;

  const { decision, decidedAt, decidedBy, rejectionReason } = approval;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
        <ShieldCheck className="size-4 text-text-tertiary" />
        Let AI remediate this?
      </div>

      {decision === "APPROVED" ? (
        <div className="flex items-center gap-3 rounded-lg border border-success-500/20 bg-success-50 px-4 py-3">
          <CheckCircle2 className="size-4 shrink-0 text-success-600" />
          <p className="text-sm text-success-700">
            <span className="font-semibold">Approved</span> by {decidedBy} at {formatDateTime(decidedAt)} — remediation authorized.
          </p>
        </div>
      ) : decision === "REJECTED" ? (
        <div className="rounded-lg border border-border bg-surface-subtle px-4 py-3">
          <div className="flex items-center gap-3">
            <XCircle className="size-4 shrink-0 text-text-tertiary" />
            <p className="text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{decidedBy}</span> rejected at {formatDateTime(decidedAt)}.
            </p>
          </div>
          {rejectionReason && <p className="mt-2 pl-7 text-sm text-text-secondary">{rejectionReason}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface-subtle px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">AI Recommends</p>
              <p className="mt-1 text-sm font-medium text-text-primary">{recommendation.action}</p>
              <p className="mt-1 text-sm text-text-secondary">{recommendation.reason}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusBadge style={RISK_STYLES[recommendation.risk]} />
              <span className="text-[11px] text-text-tertiary">{recommendation.confidencePct}% confidence</span>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-text-secondary">
            <span className="font-medium text-text-primary">Human approval is required before remediation runs</span> — nothing
            executes automatically.
          </p>

          {actionError && <p className="rounded-md bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">{actionError}</p>}

          <div className="flex flex-wrap gap-2.5">
            <Button variant="primary" isLoading={isSubmitting} onClick={() => onApprove(CURRENT_USER)}>
              <ThumbsUp className="size-3.5" />
              Approve
            </Button>
            <Button variant="secondary" disabled={isSubmitting} onClick={() => setRejectOpen(true)}>
              <ThumbsDown className="size-3.5" />
              Reject
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject AI remediation"
        description="This holds the incident for manual resolution. You can optionally record why."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={isSubmitting}
              onClick={() => {
                onReject(CURRENT_USER, reason.trim() || "No reason provided.");
                setRejectOpen(false);
                setReason("");
              }}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <label className="block text-xs font-medium text-text-secondary">
          Rejection reason (optional)
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Waiting on an onboarding ticket before this fix is safe to apply…"
            className="mt-1.5 w-full rounded-lg border border-border-strong bg-surface-subtle px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-500"
          />
        </label>
      </Modal>
    </div>
  );
}
