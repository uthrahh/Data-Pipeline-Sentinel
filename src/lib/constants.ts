import type {
  CheckStatus,
  IncidentStatus,
  PipelineExecutionStatus,
  RemediationRunStatus,
  RiskLevel,
  Severity,
} from "@/types";

export interface StatusStyle {
  label: string;
  dot: string;
  badgeClass: string;
}

export const PIPELINE_STATUS_STYLES: Record<PipelineExecutionStatus, StatusStyle> = {
  SUCCESS: {
    label: "Success",
    dot: "bg-success-500",
    badgeClass: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20",
  },
  FAILED: {
    label: "Failed",
    dot: "bg-danger-500",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20",
  },
  RUNNING: {
    label: "Running",
    dot: "bg-info-500",
    badgeClass: "bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20",
  },
  TIMED_OUT: {
    label: "Timed Out",
    dot: "bg-warning-500",
    badgeClass: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20",
  },
  PARTIAL: {
    label: "Partial",
    dot: "bg-warning-500",
    badgeClass: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20",
  },
  UNKNOWN: {
    label: "Unknown",
    dot: "bg-neutral-500",
    badgeClass: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20",
  },
};

export const INCIDENT_STATUS_STYLES: Record<IncidentStatus, StatusStyle> = {
  OPEN: {
    label: "Open",
    dot: "bg-danger-500",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20",
  },
  INVESTIGATING: {
    label: "Investigating",
    dot: "bg-info-500",
    badgeClass: "bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20",
  },
  WAITING_APPROVAL: {
    label: "Waiting Approval",
    dot: "bg-accent-500",
    badgeClass: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-500/25",
  },
  APPROVED: {
    label: "Approved",
    dot: "bg-info-500",
    badgeClass: "bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20",
  },
  REMEDIATING: {
    label: "Remediating",
    dot: "bg-info-500",
    badgeClass: "bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20",
  },
  REMEDIATION_FAILED: {
    label: "Remediation Failed",
    dot: "bg-danger-500",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20",
  },
  VALIDATING: {
    label: "Validating",
    dot: "bg-info-500",
    badgeClass: "bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20",
  },
  VALIDATION_FAILED: {
    label: "Validation Failed",
    dot: "bg-danger-500",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20",
  },
  RESOLVED: {
    label: "Resolved",
    dot: "bg-success-500",
    badgeClass: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20",
  },
  REJECTED: {
    label: "Rejected",
    dot: "bg-neutral-500",
    badgeClass: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20",
  },
};

export const CHECK_STATUS_STYLES: Record<CheckStatus, StatusStyle> = {
  PASS: {
    label: "Pass",
    dot: "bg-success-500",
    badgeClass: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20",
  },
  WARNING: {
    label: "Warning",
    dot: "bg-warning-500",
    badgeClass: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20",
  },
  FAIL: {
    label: "Fail",
    dot: "bg-danger-500",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20",
  },
  NOT_AVAILABLE: {
    label: "Not Available",
    dot: "bg-neutral-500",
    badgeClass: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20",
  },
  PENDING: {
    label: "Pending",
    dot: "bg-neutral-500",
    badgeClass: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20",
  },
};

export const REMEDIATION_STATUS_STYLES: Record<RemediationRunStatus, StatusStyle> = {
  PENDING: {
    label: "Pending",
    dot: "bg-neutral-500",
    badgeClass: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20",
  },
  RUNNING: {
    label: "Running",
    dot: "bg-info-500",
    badgeClass: "bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20",
  },
  SUCCESS: {
    label: "Success",
    dot: "bg-success-500",
    badgeClass: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20",
  },
  FAILED: {
    label: "Failed",
    dot: "bg-danger-500",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20",
  },
};

export const SEVERITY_STYLES: Record<Severity, StatusStyle> = {
  LOW: {
    label: "Low",
    dot: "bg-neutral-500",
    badgeClass: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20",
  },
  MEDIUM: {
    label: "Medium",
    dot: "bg-warning-500",
    badgeClass: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20",
  },
  HIGH: {
    label: "High",
    dot: "bg-danger-500",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20",
  },
  CRITICAL: {
    label: "Critical",
    dot: "bg-danger-600",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-600/30 font-semibold",
  },
};

export const RISK_STYLES: Record<RiskLevel, StatusStyle> = {
  LOW: {
    label: "Low Risk",
    dot: "bg-success-500",
    badgeClass: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20",
  },
  MEDIUM: {
    label: "Medium Risk",
    dot: "bg-warning-500",
    badgeClass: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20",
  },
  HIGH: {
    label: "High Risk",
    dot: "bg-danger-500",
    badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20",
  },
};

export const CURRENT_USER = "J. Datta";

export const REGION_LABELS: Record<string, string> = {
  NAC: "North America",
  EU: "Europe",
  ANZ: "Australia / NZ",
  AME: "Africa / Middle East",
  APAC: "Asia Pacific",
  GLOBAL: "Global",
};
