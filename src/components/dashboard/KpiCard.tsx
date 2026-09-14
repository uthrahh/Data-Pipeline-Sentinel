import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/common/Sparkline";

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  supportingText?: string;
  deltaPct?: number | null;
  deltaIsGood?: boolean;
  icon: LucideIcon;
  accent?: "neutral" | "danger" | "success" | "accent";
  trendData?: number[];
}

const ACCENT_ICON_CLASSES: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  danger: "bg-danger-50 text-danger-600",
  success: "bg-success-50 text-success-600",
  accent: "bg-accent-50 text-accent-600",
};

export function KpiCard({
  label,
  value,
  unit,
  supportingText,
  deltaPct,
  deltaIsGood = true,
  icon: Icon,
  accent = "neutral",
  trendData,
}: KpiCardProps) {
  const hasDelta = deltaPct !== undefined && deltaPct !== null;
  const isUp = hasDelta && deltaPct! > 0;
  const deltaGood = hasDelta ? (isUp ? deltaIsGood : !deltaIsGood) : true;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{label}</p>
        <div className={cn("flex size-7 items-center justify-center rounded-lg", ACCENT_ICON_CLASSES[accent])}>
          <Icon className="size-[15px]" strokeWidth={2} />
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[28px] font-semibold leading-none tracking-tight text-text-primary">{value}</span>
          {unit && <span className="text-sm font-medium text-text-tertiary">{unit}</span>}
        </div>
        {trendData && trendData.length > 1 && <Sparkline data={trendData} positive={deltaGood} />}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {hasDelta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              deltaGood ? "text-success-600" : "text-danger-600",
            )}
          >
            {isUp ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {Math.abs(deltaPct!).toFixed(1)}%
          </span>
        )}
        {supportingText && <span className="text-text-tertiary">{supportingText}</span>}
      </div>
    </div>
  );
}
