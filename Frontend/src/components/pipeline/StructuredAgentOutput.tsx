import { AlertTriangle, Briefcase, CheckCircle2, ListChecks, Sparkles, Zap } from "lucide-react";
import { parseAgentOutput } from "@/lib/parseAgentOutput";

const SECTION_ICONS: Array<{ match: RegExp; icon: typeof Zap }> = [
  { match: /resolved|success/i, icon: CheckCircle2 },
  { match: /unsuccessful|fail/i, icon: AlertTriangle },
  { match: /status|latest run/i, icon: Zap },
  { match: /reason|cause/i, icon: AlertTriangle },
  { match: /business impact/i, icon: Briefcase },
  { match: /recommend/i, icon: Sparkles },
];

function iconFor(title: string) {
  return SECTION_ICONS.find((s) => s.match.test(title))?.icon ?? ListChecks;
}

/**
 * Renders the real agent's own markdown-shaped output (see lib/parseAgentOutput.ts)
 * as structured sections — never a raw terminal/pre dump. Falls back to a plain
 * paragraph only if the agent text truly has no recognizable section headers.
 */
export function StructuredAgentOutput({ raw }: { raw: string | null | undefined }) {
  const sections = parseAgentOutput(raw);

  if (sections.length === 0) {
    return <p className="text-sm text-text-tertiary">No output available.</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const Icon = iconFor(section.title);
        return (
          <div key={`${section.title}-${i}`} className="rounded-lg border border-border bg-surface-subtle p-3.5">
            <div className="flex items-center gap-2">
              <Icon className="size-3.5 shrink-0 text-accent-600" />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">{section.title}</p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-sm leading-relaxed text-text-secondary">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-text-tertiary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
