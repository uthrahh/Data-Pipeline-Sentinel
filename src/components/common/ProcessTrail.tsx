/**
 * Renders the ordered trail of steps an agent performed — the "how" behind a
 * conclusion. Always paired with a narrative response block so the two stay
 * visually distinct: this is process, not the result.
 */
export function ProcessTrail({ steps }: { steps: string[] }) {
  if (steps.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      {steps.map((step, i) => (
        <span key={i} className="flex items-center gap-1.5 text-xs text-text-tertiary">
          {i > 0 && (
            <span aria-hidden className="text-text-tertiary/40">
              →
            </span>
          )}
          {step}
        </span>
      ))}
    </div>
  );
}
