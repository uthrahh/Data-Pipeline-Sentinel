"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { useAllNotificationsFromStore } from "@/lib/notificationStore";
import { NOTIFICATION_STATUS_STYLES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

const REASON_LABEL: Record<string, string> = {
  OPTIMIZATION_REQUIRED: "Optimization Required",
  TRANSIENT_JOB_FAILURE: "Transient Job Failure",
  KNOWN_TASK_RESTART: "Known Task Restart",
  SCHEMA_CHANGE: "Schema Change",
  UNKNOWN_ERROR: "Unknown Error",
  DATA_QUALITY_BREACH: "Data Quality Breach",
  PERMISSION_ISSUE: "Permission Issue",
};

/**
 * Replaces the old Remediation tab. Every email/message Sentinel has ever
 * drafted — from a pipeline failure or a SUCCESS - PARTIAL optimization
 * finding — lives here, with its full context and current status.
 */
export default function NotificationsPage() {
  const router = useRouter();
  const notifications = useAllNotificationsFromStore();

  const counts = useMemo(
    () => ({
      waiting: notifications.filter((n) => n.status === "WAITING_APPROVAL").length,
      sent: notifications.filter((n) => n.status === "SENT").length,
      rejected: notifications.filter((n) => n.status === "REJECTED").length,
    }),
    [notifications],
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Notifications"
        description={`Every email drafted from an incident or optimization finding. ${counts.waiting} waiting on you, ${counts.sent} sent, ${counts.rejected} rejected.`}
      />

      <div className="p-4 sm:p-6">
        {notifications.length === 0 ? (
          <EmptyState title="No notifications yet" description="Notifications appear here once an incident or optimization finding drafts one." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface-subtle text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Subject</th>
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Recipient</th>
                  <th className="px-4 py-2.5">Incident</th>
                  <th className="px-4 py-2.5">Created</th>
                  <th className="px-4 py-2.5">Sent</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr
                    key={n.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => router.push(`/notifications/${n.id}`)}
                    onKeyDown={(e) => e.key === "Enter" && router.push(`/notifications/${n.id}`)}
                    className="group cursor-pointer border-b border-border text-xs transition-colors last:border-0 hover:bg-surface-subtle"
                  >
                    <td className="px-4 py-3">
                      <StatusBadge style={NOTIFICATION_STATUS_STYLES[n.status]} />
                    </td>
                    <td className="max-w-[320px] px-4 py-3">
                      <div className="flex items-center gap-1.5 truncate font-medium text-text-primary">
                        {n.subject}
                        <ExternalLink className="size-3 shrink-0 text-text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{REASON_LABEL[n.reason] ?? n.reason}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{n.recipient}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-text-tertiary">{n.incidentId ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(n.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(n.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
