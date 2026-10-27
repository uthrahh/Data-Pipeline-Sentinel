"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Segmented } from "@/components/common/Segmented";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toneStyle } from "@/lib/constants";
import { NOTIFICATION_DAYS, WORKSPACE_BY_ID, PIPELINE_BY_NAME, inWorkspace } from "@/ops/catalog";
import { FAILURE_BY_KEY, FAILURE_TYPES, type FailureKey } from "@/ops/failureTypes";
import { useOps } from "@/ops/store";
import { formatDateTime } from "@/lib/utils";

type Kind = "ALL" | "Email" | "Escalation";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, workspace, days } = useOps();
  const [kind, setKind] = useState<Kind>("ALL");
  const [failure, setFailure] = useState<FailureKey | "ALL">("ALL");
  const [query, setQuery] = useState("");

  const scoped = useMemo(
    () => {
      const cutoff = `${days[days.length - NOTIFICATION_DAYS]}T00:00:00.000Z`;
      return notifications.filter((n) => n.sentAt >= cutoff && inWorkspace(PIPELINE_BY_NAME[n.pipeline]?.id ?? "", workspace));
    },
    [notifications, workspace, days],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped
      .filter((n) => kind === "ALL" || n.kind === kind)
      .filter((n) => failure === "ALL" || n.failureKey === failure)
      .filter(
        (n) =>
          !q ||
          n.incidentId.toLowerCase().includes(q) ||
          n.subject.toLowerCase().includes(q) ||
          n.recipient.name.toLowerCase().includes(q) ||
          n.pipeline.toLowerCase().includes(q),
      );
  }, [scoped, kind, failure, query]);

  const escalations = scoped.filter((n) => n.kind === "Escalation").length;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Notifications"
        description={`${WORKSPACE_BY_ID[workspace].name} — emails and escalations sent in the last 7 days. Each one is linked to its incident.`}
      />

      <div className="flex flex-col gap-5 p-4 sm:px-8 sm:pb-10 sm:pt-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sent in the last 7 days", value: scoped.length },
            { label: "Escalations", value: escalations },
            { label: "Other emails", value: scoped.length - escalations },
          ].map((c) => (
            <div key={c.label} data-spotlight className="rounded-xl border border-border bg-surface px-4 py-3.5 shadow-xs">
              <p className="text-[11px] font-medium text-text-tertiary">{c.label}</p>
              <p className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.04em] text-text-primary num">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
            <Segmented
              label="Filter by type"
              value={kind}
              options={[
                { value: "ALL", label: "All" },
                { value: "Email", label: "Emails" },
                { value: "Escalation", label: "Escalations" },
              ]}
              onChange={setKind}
            />
            <select
              value={failure}
              onChange={(e) => setFailure(e.target.value as FailureKey | "ALL")}
              aria-label="Filter by failure type"
              className="rounded-lg border border-border-strong bg-surface px-2.5 py-1.5 text-xs text-text-secondary"
            >
              <option value="ALL">All failure types</option>
              {FAILURE_TYPES.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-2.5 py-1.5">
              <Search className="size-3.5 text-text-tertiary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by incident, subject or person"
                aria-label="Search notifications"
                className="w-56 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No notifications match" description="Try a different type or failure type filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-subtle text-[11px] font-medium text-text-tertiary">
                    <th className="px-4 py-2.5">Incident ID</th>
                    <th className="px-4 py-2.5">Subject</th>
                    <th className="px-4 py-2.5">Reason</th>
                    <th className="px-4 py-2.5">Respective Person</th>
                    <th className="px-4 py-2.5">Failure Type</th>
                    <th className="px-4 py-2.5">Pipeline Name</th>
                    <th className="px-4 py-2.5">Type</th>
                    <th className="px-4 py-2.5">Sent (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((n) => (
                    <tr
                      key={n.id}
                      tabIndex={0}
                      role="link"
                      onClick={() => router.push(`/notifications/${n.id}`)}
                      onKeyDown={(e) => e.key === "Enter" && router.push(`/notifications/${n.id}`)}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-subtle"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-medium text-text-primary">{n.incidentId}</td>
                      <td className="max-w-[18rem] px-4 py-3 font-medium text-text-primary">{n.subject}</td>
                      <td className="max-w-[18rem] px-4 py-3 text-text-secondary">{n.reason}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-primary">{n.recipient.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{FAILURE_BY_KEY[n.failureKey].label}</td>
                      <td className="px-4 py-3 text-text-secondary">{n.pipeline}</td>
                      <td className="px-4 py-3">
                        <StatusBadge style={n.kind === "Escalation" ? toneStyle("Escalation", "warning") : toneStyle("Email", "info")} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{formatDateTime(n.sentAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-border px-4 py-2.5 text-xs text-text-tertiary">
            {filtered.length} of {scoped.length} notifications
          </div>
        </div>
      </div>
    </div>
  );
}
