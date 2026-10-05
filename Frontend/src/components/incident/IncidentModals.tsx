"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail, Rocket } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { buildEmail } from "@/ops/email";
import { sendEmail, type RemediationStart } from "@/ops/store";
import type { AppNotification, Incident } from "@/ops/types";
import { WORKSPACE_BY_ID, PIPELINE_BY_ID } from "@/ops/catalog";
import { formatDateTime } from "@/lib/utils";

export function EmailModal({ incident, open, onClose }: { incident: Incident; open: boolean; onClose: () => void }) {
  const [sent, setSent] = useState<AppNotification | null>(null);
  const draft = buildEmail(incident);

  const close = () => {
    onClose();
    setTimeout(() => setSent(null), 200);
  };

  if (sent) {
    return (
      <Modal
        open={open}
        onClose={close}
        title="Email sent"
        footer={
          <>
            <Link href="/notifications" className="inline-flex h-9 items-center rounded-lg border border-border-strong px-4 text-sm font-medium text-text-secondary hover:bg-surface-muted">
              View notifications
            </Link>
            <Button onClick={close}>Done</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-600" />
          <div className="text-sm text-text-secondary">
            <p>
              The escalation email for <span className="font-mono text-xs text-text-primary">{incident.id}</span> was sent to <strong className="text-text-primary">{sent.recipient.name}</strong> ({sent.recipient.email}).
            </p>
            <p className="mt-2 text-xs text-text-tertiary">It is now listed under Notifications as {sent.id}.</p>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      title="Escalate by email"
      description="The email is generated from this incident — including the reason and the recommended solution."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={() => setSent(sendEmail(incident.id))}>
            <Mail className="size-3.5" />
            Send email
          </Button>
        </>
      }
    >
      <dl className="space-y-1.5 text-xs">
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 text-text-tertiary">To</dt>
          <dd className="text-text-primary">
            {draft.toName} &lt;{draft.to}&gt;
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 text-text-tertiary">Cc</dt>
          <dd className="text-text-primary">{draft.cc.join(", ")}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-12 shrink-0 text-text-tertiary">Subject</dt>
          <dd className="font-medium text-text-primary">{draft.subject}</dd>
        </div>
      </dl>
      <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-subtle p-3 font-sans text-xs leading-relaxed text-text-secondary">{draft.body}</pre>
    </Modal>
  );
}

export function RemediationStartedModal({ info, onClose }: { info: RemediationStart | null; onClose: () => void }) {
  const pipeline = info ? Object.values(PIPELINE_BY_ID).find((p) => p.name === info.pipeline) : null;
  const workspace = pipeline ? WORKSPACE_BY_ID[pipeline.workspaceId].name : "Databricks";

  return (
    <Modal
      open={info !== null}
      onClose={onClose}
      title="Pipeline started in Databricks"
      footer={<Button onClick={onClose}>OK</Button>}
    >
      {info && (
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
            <Rocket className="size-4.5" />
          </div>
          <div className="min-w-0 text-sm text-text-secondary">
            <p>
              <strong className="text-text-primary">{info.pipeline}</strong> has been started in Databricks.
            </p>
            <dl className="mt-3 space-y-1.5 text-xs">
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-text-tertiary">Remediation</dt>
                <dd className="text-text-primary">{info.action}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-text-tertiary">Run ID</dt>
                <dd className="font-mono text-text-primary">{info.remediationRunId}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-text-tertiary">Workspace</dt>
                <dd className="text-text-primary">{workspace}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 shrink-0 text-text-tertiary">Started</dt>
                <dd className="text-text-primary">{formatDateTime(info.startedAt)} UTC</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-text-tertiary">The incident updates automatically once the run is validated.</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
