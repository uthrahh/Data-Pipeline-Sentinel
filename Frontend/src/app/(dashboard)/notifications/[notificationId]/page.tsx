"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, Send, ThumbsDown, XCircle } from "lucide-react";
import { useNotificationFromStore, sendNotification, rejectNotification, updateNotificationContent } from "@/lib/notificationStore";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { NOTIFICATION_STATUS_STYLES } from "@/lib/constants";
import { CURRENT_USER } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm text-text-primary">{value}</p>
    </div>
  );
}

export default function NotificationDetailPage() {
  const params = useParams<{ notificationId: string }>();
  const router = useRouter();
  const notificationId = decodeURIComponent(params.notificationId);
  const notification = useNotificationFromStore(notificationId);
  const [draft, setDraft] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!notification) {
    return (
      <EmptyState
        title="Notification not found"
        description={`No notification matches ID "${notificationId}".`}
        className="py-24"
        action={
          <button onClick={() => router.push("/notifications")} className="text-xs font-medium text-accent-600 hover:text-accent-700">
            Back to all notifications
          </button>
        }
      />
    );
  }

  const canDecide = notification.status === "WAITING_APPROVAL" || notification.status === "DRAFT";
  const messageValue = draft ?? notification.messageContent;

  return (
    <div className="flex flex-col">
      <PageHeader
        title={notification.subject}
        breadcrumbs={[{ label: "Notifications", href: "/notifications" }, { label: notification.id }]}
        badge={<StatusBadge style={NOTIFICATION_STATUS_STYLES[notification.status]} size="md" />}
        actions={
          <button
            onClick={() => router.push("/notifications")}
            className="flex items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
          >
            <ArrowLeft className="size-3.5" />
            All Notifications
          </button>
        }
      />

      <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
        <Card>
          <CardHeader title="Details" icon={<Mail className="size-4" />} />
          <CardBody className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <Field label="Incident" value={notification.incidentId ? <Link href={`/incidents/${notification.incidentId}`} className="text-accent-600 hover:text-accent-700">{notification.incidentId}</Link> : "—"} />
            <Field label="Pipeline" value={notification.pipelineName} />
            <Field label="Recipient" value={notification.recipient} />
            <Field label="Created" value={formatDateTime(notification.createdAt)} />
            <Field label="Sent" value={formatDateTime(notification.sentAt)} />
            <Field label="Approved / Sent By" value={notification.approvedBy ?? "—"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Issue &amp; Recommendation" />
          <CardBody className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Issue</p>
              <p className="mt-1 text-sm text-text-secondary">{notification.issueDetails}</p>
            </div>
            {notification.investigationSummary && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Investigation Summary</p>
                <p className="mt-1 text-sm text-text-secondary">{notification.investigationSummary}</p>
              </div>
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Recommendation</p>
              <p className="mt-1 text-sm text-text-secondary">{notification.recommendation}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">DQ Result</p>
                <p className="mt-1 text-sm text-text-secondary">{notification.dq ? notification.dq.summary : "Not available"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">SLA Result</p>
                <p className="mt-1 text-sm text-text-secondary">{notification.sla ? notification.sla.summary : "Not available"}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Message" description="Review and edit before sending — nothing is delivered until you click Send." />
          <CardBody className="space-y-3">
            <textarea
              value={messageValue}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!canDecide}
              rows={8}
              className="w-full rounded-lg border border-border-strong bg-surface-subtle px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-500 disabled:opacity-70"
            />

            {notification.status === "SENT" && (
              <div className="flex items-center gap-2.5 rounded-lg border border-success-500/20 bg-success-50 px-4 py-3">
                <CheckCircle2 className="size-4 shrink-0 text-success-600" />
                <p className="text-sm text-success-700">
                  Sent to {notification.recipient} on {formatDateTime(notification.sentAt)}, approved by {notification.approvedBy}.
                </p>
              </div>
            )}
            {notification.status === "REJECTED" && (
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-subtle px-4 py-3">
                <XCircle className="size-4 shrink-0 text-text-tertiary" />
                <p className="text-sm text-text-secondary">Rejected by {notification.approvedBy ?? "a reviewer"} — not sent.</p>
              </div>
            )}

            {canDecide && (
              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="primary"
                  isLoading={isSubmitting}
                  onClick={() => {
                    setIsSubmitting(true);
                    if (draft !== null) updateNotificationContent(notification.id, { messageContent: draft });
                    sendNotification(notification.id, CURRENT_USER);
                    setIsSubmitting(false);
                  }}
                >
                  <Send className="size-3.5" />
                  Send
                </Button>
                <Button
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => rejectNotification(notification.id, CURRENT_USER)}
                >
                  <ThumbsDown className="size-3.5" />
                  Reject
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
