"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import type { Incident } from "@/types";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { CURRENT_USER } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface ApprovalPanelProps {
  incident: Incident;
  onApprove: (decidedBy: string) => void;
  onReject: (decidedBy: string, reason: string) => void;
  isSubmitting: boolean;
  actionError: string | null;
}

export function ApprovalPanel({ incident, onApprove, onReject, isSubmitting, actionError }: ApprovalPanelProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!incident.approval) return null;
  const { decision, decidedAt, decidedBy, rejectionReason } = incident.approval;

  if (decision === "APPROVED") {
    return (
      <Card>
        <CardBody className="flex items-center gap-3 bg-success-50/60">
          <CheckCircle2 className="size-5 shrink-0 text-success-600" />
          <p className="text-sm text-success-700">
            <span className="font-semibold">Remediation approved</span> by {decidedBy} at {formatDateTime(decidedAt)}.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (decision === "REJECTED") {
    return (
      <Card>
        <CardHeader title="Recommendation Rejected" icon={<XCircle className="size-4" />} />
        <CardBody>
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">{decidedBy}</span> rejected the AI recommendation at{" "}
            {formatDateTime(decidedAt)}.
          </p>
          {rejectionReason && (
            <div className="mt-3 rounded-lg border border-border bg-surface-subtle px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Reason</p>
              <p className="mt-1 text-sm text-text-secondary">{rejectionReason}</p>
            </div>
          )}
        </CardBody>
      </Card>
    );
  }

  // Waiting for a decision.
  return (
    <Card className="border-accent-500/30 ring-1 ring-accent-500/10">
      <CardHeader title="Human Approval Required" icon={<ShieldCheck className="size-4 text-accent-600" />} />
      <CardBody>
        <p className="mb-4 text-sm leading-relaxed text-text-secondary">
          The AI has recommended a remediation action. <span className="font-medium text-text-primary">Human approval is required before remediation runs</span> — nothing executes automatically.
        </p>

        {actionError && (
          <p className="mb-3 rounded-md bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">{actionError}</p>
        )}

        <div className="flex flex-wrap gap-2.5">
          <Button variant="primary" isLoading={isSubmitting} onClick={() => onApprove(CURRENT_USER)}>
            <ThumbsUp className="size-3.5" />
            Approve Remediation
          </Button>
          <Button variant="secondary" disabled={isSubmitting} onClick={() => setRejectOpen(true)}>
            <ThumbsDown className="size-3.5" />
            Reject
          </Button>
        </div>
      </CardBody>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject remediation recommendation"
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
    </Card>
  );
}
