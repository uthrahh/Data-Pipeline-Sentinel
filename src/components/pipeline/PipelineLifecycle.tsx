import { Check, X, Minus, Loader2 } from "lucide-react";
import type { IncidentStatus } from "@/types";
import { getLifecycleSteps, type StepState } from "@/lib/lifecycle";
import { cn } from "@/lib/utils";

const STATE_STYLES: Record<StepState, { circle: string; line: string; label: string }> = {
  complete: {
    circle: "bg-success-500 text-white border-success-500",
    line: "bg-success-500",
    label: "text-text-primary",
  },
  current: {
    circle: "bg-accent-500 text-white border-accent-500 ring-4 ring-accent-100",
    line: "bg-border-strong",
    label: "text-accent-700 font-semibold",
  },
  failed: {
    circle: "bg-danger-500 text-white border-danger-500",
    line: "bg-border-strong",
    label: "text-danger-700 font-semibold",
  },
  stopped: {
    circle: "bg-neutral-500 text-white border-neutral-500",
    line: "bg-border-strong",
    label: "text-text-secondary font-medium",
  },
  pending: {
    circle: "bg-surface text-text-tertiary border-border-strong",
    line: "bg-border",
    label: "text-text-tertiary",
  },
};

function StepIcon({ state }: { state: StepState }) {
  if (state === "complete") return <Check className="size-3.5" strokeWidth={3} />;
  if (state === "failed") return <X className="size-3.5" strokeWidth={3} />;
  if (state === "stopped") return <Minus className="size-3.5" strokeWidth={3} />;
  if (state === "current") return <Loader2 className="size-3.5 animate-spin" strokeWidth={3} />;
  return null;
}

export function PipelineLifecycle({ status }: { status: IncidentStatus }) {
  const steps = getLifecycleSteps(status);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <ol className="flex min-w-[720px] items-start">
        {steps.map((step, i) => {
          const styles = STATE_STYLES[step.state];
          const isLast = i === steps.length - 1;
          return (
            <li key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    styles.circle,
                  )}
                >
                  <StepIcon state={step.state} />
                </div>
                <span className={cn("whitespace-nowrap text-[11px]", styles.label)}>{step.label}</span>
              </div>
              {!isLast && (
                <div className={cn("mx-1.5 h-0.5 flex-1 -translate-y-3 rounded-full transition-colors", styles.line)} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
