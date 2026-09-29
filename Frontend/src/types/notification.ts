import type { DQResult, SLAResult } from "./incident";

export type NotificationStatus = "DRAFT" | "WAITING_APPROVAL" | "SENT" | "REJECTED";

export type NotificationReason =
  | "OPTIMIZATION_REQUIRED"
  | "TRANSIENT_JOB_FAILURE"
  | "KNOWN_TASK_RESTART"
  | "SCHEMA_CHANGE"
  | "UNKNOWN_ERROR"
  | "DATA_QUALITY_BREACH"
  | "PERMISSION_ISSUE";

/**
 * An email/message generated from an incident or a SUCCESS - PARTIAL
 * optimization finding. Nothing is ever actually delivered (this is a
 * static site with no backend/email provider) — "Send" simulates delivery
 * by moving status to SENT and recording sentAt/approvedBy.
 */
export interface Notification {
  id: string;
  incidentId: string | null;
  pipelineName: string;
  country: string;
  reason: NotificationReason;
  issueDetails: string;
  investigationSummary: string;
  dq: DQResult | null;
  sla: SLAResult | null;
  recommendation: string;
  subject: string;
  messageContent: string;
  /** Always the pipeline's actual owner ("Name <email>") — never a generic team alias. */
  recipient: string;
  status: NotificationStatus;
  createdAt: string;
  sentAt: string | null;
  approvedBy: string | null;
}
