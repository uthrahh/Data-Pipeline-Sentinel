import type { Notification, NotificationReason, NotificationStatus } from "@/types";
import { MOCK_INCIDENTS } from "@/data/mock/incidents";
import { formatRecipient } from "@/data/mock/people";

/**
 * Per-notification metadata not already on the source incident. Derived
 * (dq/sla/issue/investigation summary, and the recipient) fields come from
 * the linked incident, so they can never drift out of sync — in
 * particular, the recipient is always the pipeline's actual owner
 * (incident.assignee), never a generic team alias.
 */
const NOTIFICATION_META: Record<
  string,
  {
    incidentId: string;
    reason: NotificationReason;
    subject: string;
    messageContent: string;
    status: NotificationStatus;
    createdAt: string;
    sentAt: string | null;
    approvedBy: string | null;
  }
> = {
  "NOTIF-T1002": {
    incidentId: "INC-T1002",
    reason: "TRANSIENT_JOB_FAILURE",
    subject: "[Sentinel] Material Master (CA) — repeated cluster termination, needs platform review",
    messageContent:
      "Incident INC-T1002: the Material Master Processing pipeline for Canada failed twice in a row with the same spot-instance-reclamation signature (CLUSTER_TERMINATED). An automatic rerun was attempted after approval and also failed.\n\nDQ: not available (rerun didn't complete). SLA: breached (20 min configured, no completion).\n\nRecommended action: move this job off spot instances, or investigate regional capacity pressure. Run page: see incident detail.",
    status: "WAITING_APPROVAL",
    createdAt: "2026-09-29T02:18:00Z",
    sentAt: null,
    approvedBy: null,
  },
  "NOTIF-K1004": {
    incidentId: "INC-K1004",
    reason: "KNOWN_TASK_RESTART",
    subject: "[Sentinel] Procurement (GB) — task restart failed, cluster rebuild needed",
    messageContent:
      "Incident INC-K1004: the Procurement Processing pipeline for the United Kingdom failed with a known-restartable task failure, but the automatic restart also failed with the same executor-starvation signature.\n\nDQ: not available. SLA: breached (25 min configured, no completion).\n\nRecommended action: rebuild the underlying job cluster — task-level restart isn't sufficient this time.",
    status: "WAITING_APPROVAL",
    createdAt: "2026-09-29T02:22:30Z",
    sentAt: null,
    approvedBy: null,
  },
  "NOTIF-S1005": {
    incidentId: "INC-S1005",
    reason: "SCHEMA_CHANGE",
    subject: "[Sentinel] Sales & Manufacturing (DE) — new column in sap_sales_order_item",
    messageContent:
      "Incident INC-S1005: sap_sales_order_item now includes a new column (delivery_priority_code) that 03_sales_manufacturing_transformation's expected schema does not define. The pipeline is blocked until this is reconciled.\n\nDQ: schema validation failed before row-level checks could run. SLA: breached (30 min configured, no completion).\n\nRecommended action: add delivery_priority_code to the notebook's expected schema (or explicitly drop it), then rerun manually once approved.",
    status: "SENT",
    createdAt: "2026-09-29T02:08:00Z",
    sentAt: "2026-09-29T02:14:00Z",
    approvedBy: "A. Singh",
  },
  "NOTIF-U1006": {
    incidentId: "INC-U1006",
    reason: "UNKNOWN_ERROR",
    subject: "[Sentinel] Material Master (FR) — unrecognized exception, needs manual review",
    messageContent:
      "Incident INC-U1006: an exception with no matching configured failure signature occurred in 01_standardize_material_master for France. Investigation confidence is low (30%) — this needs a human to read the full stack trace rather than guess at an automatic fix.\n\nDQ: not available. SLA: breached (20 min configured, no completion).\n\nRecommended action: manual log review; file a platform bug if this recurs.",
    status: "SENT",
    createdAt: "2026-09-29T02:05:00Z",
    sentAt: "2026-09-29T02:11:00Z",
    approvedBy: "C. Silva",
  },
  "NOTIF-D1008": {
    incidentId: "INC-D1008",
    reason: "DATA_QUALITY_BREACH",
    subject: "[Sentinel] Sales & Manufacturing (IN) — source extract is completely empty",
    messageContent:
      "Incident INC-D1008: the sap_sales_order_item extract for India was completely empty (header row only, 0 data rows) — a full data-quality breach. Rather than run against empty data (which would silently zero out downstream sales reporting), the assigned engineer chose to notify you instead.\n\nDQ: complete breach — table is empty. SLA: breached (30 min configured).\n\nRecommended action: check the upstream SAP export job for IN; it produced a header-only file instead of the expected 800-1,400 rows.",
    status: "SENT",
    createdAt: "2026-09-29T02:07:00Z",
    sentAt: "2026-09-29T02:09:00Z",
    approvedBy: "J. Nakamura",
  },
  "NOTIF-P1009": {
    incidentId: "INC-P1009",
    reason: "PERMISSION_ISSUE",
    subject: "[Sentinel] Material Master (AU) — missing USE CATALOG grant",
    messageContent:
      "Incident INC-P1009: the Material Master Processing pipeline for Australia failed with INSUFFICIENT_PERMISSIONS — the pipeline's service principal is missing USE CATALOG on ai_dataops_poc. This looks like the result of a recent permission change.\n\nDQ: not available (blocked before reading data). SLA: breached (20 min configured, no completion).\n\nRecommended action: grant USE CATALOG on ai_dataops_poc to the pipeline's service principal, then rerun.",
    status: "WAITING_APPROVAL",
    createdAt: "2026-09-29T02:02:00Z",
    sentAt: null,
    approvedBy: null,
  },
  "NOTIF-T1010": {
    incidentId: "INC-T1010",
    reason: "OPTIMIZATION_REQUIRED",
    subject: "[Sentinel] Sales & Manufacturing (JP) — optimization recommended (SLA exceeded)",
    messageContent:
      "Incident INC-T1010: the Sales & Manufacturing Processing pipeline for Japan recovered from a transient connection reset, and both DQ checks passed — but the rerun took 34 minutes against a 30-minute SLA, so this closed as SUCCESS - PARTIAL rather than a clean success.\n\nDQ: pass. SLA: exceeded by 4 minutes.\n\nRecommended action: review partition pruning / cluster sizing for this pipeline to bring runtime back under SLA.",
    status: "WAITING_APPROVAL",
    createdAt: "2026-09-29T02:40:30Z",
    sentAt: null,
    approvedBy: null,
  },
};

function buildNotifications(): Notification[] {
  return MOCK_INCIDENTS.filter((i) => i.notificationId && NOTIFICATION_META[i.notificationId]).map((incident) => {
    const meta = NOTIFICATION_META[incident.notificationId as string];
    return {
      id: incident.notificationId as string,
      incidentId: incident.incidentId,
      pipelineName: incident.pipelineName,
      country: incident.country ?? "",
      reason: meta.reason,
      issueDetails: incident.failure.errorMessage,
      investigationSummary: incident.investigation?.rootCause ?? "",
      dq: incident.dq,
      sla: incident.sla,
      recommendation: incident.recommendation?.action ?? "",
      subject: meta.subject,
      messageContent: meta.messageContent,
      recipient: formatRecipient(incident.assignee),
      status: meta.status,
      createdAt: meta.createdAt,
      sentAt: meta.sentAt,
      approvedBy: meta.approvedBy,
    };
  });
}

export const MOCK_NOTIFICATIONS: Notification[] = buildNotifications();
