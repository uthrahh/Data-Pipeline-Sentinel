import type { DQCheckResult, SLAResult } from "@/types";

/**
 * Derives the short "agent response" narrative for a DQ or SLA result from
 * its underlying numbers, the same way a real backend agent would compose a
 * summary from its check results before returning them over the API. Kept
 * out of UI components so presentational code never embeds this logic —
 * components only ever render whatever `summary` the data provides.
 */

export function summarizeDQ(checks: DQCheckResult[]): string {
  if (checks.length === 0) {
    return "No data quality checks have run yet.";
  }

  const failing = checks.filter((c) => c.status === "FAIL").map((c) => c.metric);
  const warning = checks.filter((c) => c.status === "WARNING").map((c) => c.metric);
  const evaluated = checks.filter((c) => c.status !== "NOT_AVAILABLE" && c.status !== "PENDING");

  if (failing.length > 0) {
    return `${failing.join(" and ")} did not meet expectations (${evaluated.length} of ${checks.length} checks evaluated).`;
  }
  if (warning.length > 0) {
    return `All checks passed, with a warning on ${warning.join(" and ")}.`;
  }
  return `All ${evaluated.length} data quality checks passed.`;
}

export function summarizeSLA(sla: Pick<SLAResult, "status" | "configuredMinutes" | "actualMinutes">): string {
  if (sla.status === "NOT_AVAILABLE") {
    return "SLA has not been evaluated for this execution yet.";
  }

  const { configuredMinutes: cfg, actualMinutes: actual } = sla;

  if (sla.status === "PASS") {
    return cfg !== null && actual !== null
      ? `Completed in ${actual} min, ${cfg - actual} min inside the ${cfg}-min SLA.`
      : "Completed within the configured SLA.";
  }

  if (cfg !== null && actual !== null && actual > cfg) {
    return `Ran ${actual} min, exceeding the ${cfg}-min SLA by ${actual - cfg} min.`;
  }
  return cfg !== null && actual !== null
    ? `Failed after ${actual} min, before reaching the ${cfg}-min SLA.`
    : "Did not meet the configured SLA.";
}
