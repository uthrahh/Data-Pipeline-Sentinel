/**
 * "Health score based on runtime" (Overview spec item 7) and "optimization
 * required... based on average runtime for each pipeline" (item 7) — both
 * plain, transparent formulas over durationMinutes vs. the configured
 * avg/max runtime baselines, not an inferred/AI score.
 */

export function computeHealthScore(
  durationMinutes: number | null,
  avgRuntimeMinutes: number,
  maxRuntimeMinutes: number,
): number {
  if (durationMinutes === null) return 0;
  if (durationMinutes <= avgRuntimeMinutes) return 100;
  if (durationMinutes >= maxRuntimeMinutes) return 35;
  const ratio = (durationMinutes - avgRuntimeMinutes) / Math.max(1, maxRuntimeMinutes - avgRuntimeMinutes);
  return Math.round(100 - ratio * 65);
}

/** More than 30% over the configured average runtime -> flagged for optimization. */
export function isOptimizationRequired(durationMinutes: number | null, avgRuntimeMinutes: number): boolean {
  if (durationMinutes === null) return false;
  return durationMinutes > avgRuntimeMinutes * 1.3;
}
