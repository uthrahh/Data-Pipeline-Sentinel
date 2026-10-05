export interface StatusStyle {
  label: string;
  dot: string;
  badgeClass: string;
}

export type Tone = "success" | "danger" | "warning" | "info" | "accent" | "neutral";

const TONES: Record<Tone, Omit<StatusStyle, "label">> = {
  success: { dot: "bg-success-500", badgeClass: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20" },
  danger: { dot: "bg-danger-500", badgeClass: "bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20" },
  warning: { dot: "bg-warning-500", badgeClass: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20" },
  info: { dot: "bg-info-500", badgeClass: "bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20" },
  accent: { dot: "bg-accent-500", badgeClass: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-500/25" },
  neutral: { dot: "bg-neutral-500", badgeClass: "bg-neutral-50 text-neutral-600 ring-1 ring-inset ring-neutral-500/20" },
};

export function toneStyle(label: string, tone: Tone): StatusStyle {
  return { label, ...TONES[tone] };
}
