import { cn } from "@/lib/utils";

export type DayHealth = "success" | "partial" | "failed" | "none";

interface HealthCalendarProps {
  pipelines: string[];
  dates: string[];
  cellStatus: (pipeline: string, date: string) => DayHealth;
  pipelineLabel?: (pipeline: string) => string;
}

const CELL_STYLES: Record<DayHealth, string> = {
  success: "bg-success-500",
  partial: "bg-warning-500",
  failed: "bg-danger-500",
  none: "bg-surface-muted",
};

export function HealthCalendar({ pipelines, dates, cellStatus, pipelineLabel = (p) => p }: HealthCalendarProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-surface px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
              Pipeline
            </th>
            {dates.map((d) => (
              <th key={d} className="w-9 px-0.5 py-2 text-center text-[10px] font-medium text-text-tertiary">
                {new Date(d).toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pipelines.map((pipeline) => (
            <tr key={pipeline} className="border-t border-border">
              <td className="sticky left-0 z-10 whitespace-nowrap bg-surface px-4 py-2 font-medium text-text-primary">
                {pipelineLabel(pipeline)}
              </td>
              {dates.map((d) => {
                const status = cellStatus(pipeline, d);
                return (
                  <td key={d} className="px-0.5 py-2 text-center">
                    <span
                      title={`${pipeline} — ${d} — ${status}`}
                      className={cn("mx-auto block size-4 rounded-[4px]", CELL_STYLES[status])}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-center gap-4 px-4 text-[11px] text-text-tertiary">
        <LegendDot color="success" label="All succeeded" />
        <LegendDot color="partial" label="Partial / warning" />
        <LegendDot color="failed" label="Failure occurred" />
        <LegendDot color="none" label="No run" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: DayHealth; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-[3px]", CELL_STYLES[color])} />
      {label}
    </span>
  );
}
