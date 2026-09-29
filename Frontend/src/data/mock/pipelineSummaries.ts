import type { CountryCode, PipelineCategory, PipelineExecutionStatus, PipelineSummary } from "@/types";
import { COUNTRIES, getPipeline } from "@/config/sapPipelineConfig";
import { computeHealthScore, isOptimizationRequired } from "@/lib/pipelineHealth";
import { seededFloat, seededInt, seededPick, seededRandom, seededShuffle } from "@/lib/seededRandom";
import type { OverviewSettings } from "@/lib/overviewSettings";
import { DEFAULT_OVERVIEW_SETTINGS } from "@/lib/overviewSettings";
import { PEOPLE, emailFor } from "@/data/mock/people";

const CATEGORIES: { id: PipelineCategory; label: string; scheduledTime: string; slaMinutes: number }[] = [
  { id: "material_master_processing", label: "Material Master Processing", scheduledTime: "02:00", slaMinutes: 20 },
  { id: "procurement_processing", label: "Procurement Processing", scheduledTime: "02:15", slaMinutes: 25 },
  { id: "sales_processing", label: "Sales & Manufacturing Processing", scheduledTime: "02:05", slaMinutes: 30 },
];

/**
 * The fixed set of pipelines that always carry a specific, named incident —
 * one worked example per failure type (and its rerun-succeeds /
 * rerun-fails / partial-success sub-scenarios), so every failure type in
 * the spec always has a real example on screen, regardless of what the
 * Overview settings knobs are set to. See data/mock/incidents.ts for the
 * full incident record each of these ids maps to.
 */
export const FIXED_INCIDENT_EXAMPLES: Record<
  string,
  { incidentId: string; pipelineStatus: PipelineExecutionStatus; durationOverrideMinutes: number | null; owner: string }
> = {
  "material_master_processing_US": { incidentId: "INC-T1001", pipelineStatus: "SUCCESS", durationOverrideMinutes: 9, owner: "T. Alvarez" }, // transient, rerun succeeded -> RESOLVED
  "material_master_processing_CA": { incidentId: "INC-T1002", pipelineStatus: "FAILED", durationOverrideMinutes: null, owner: "R. Kimura" }, // transient, rerun failed -> REMEDIATION_FAILED
  "procurement_processing_MX": { incidentId: "INC-K1003", pipelineStatus: "SUCCESS", durationOverrideMinutes: 22, owner: "M. Dubois" }, // known task restart succeeded -> RESOLVED
  "procurement_processing_GB": { incidentId: "INC-K1004", pipelineStatus: "FAILED", durationOverrideMinutes: null, owner: "H. Muller" }, // known task restart failed -> REMEDIATION_FAILED
  "sales_processing_DE": { incidentId: "INC-S1005", pipelineStatus: "FAILED", durationOverrideMinutes: null, owner: "A. Singh" }, // schema change -> FAILED, no remediation
  "material_master_processing_FR": { incidentId: "INC-U1006", pipelineStatus: "FAILED", durationOverrideMinutes: null, owner: "C. Silva" }, // unknown error -> FAILED, no remediation
  "procurement_processing_SG": { incidentId: "INC-D1007", pipelineStatus: "FAILED", durationOverrideMinutes: null, owner: "P. Reddy" }, // DQ breach, awaiting user decision
  "sales_processing_IN": { incidentId: "INC-D1008", pipelineStatus: "FAILED", durationOverrideMinutes: null, owner: "J. Nakamura" }, // DQ breach, user sent email -> FAILED
  "material_master_processing_AU": { incidentId: "INC-P1009", pipelineStatus: "FAILED", durationOverrideMinutes: null, owner: "S. Okafor" }, // permission issue -> WAITING_APPROVAL
  "sales_processing_JP": { incidentId: "INC-T1010", pipelineStatus: "SUCCESS", durationOverrideMinutes: 34, owner: "P. Reddy" }, // transient rerun succeeded but DQ/SLA issue -> SUCCESS_PARTIAL
};

function pipelineKey(category: PipelineCategory, country: CountryCode): string {
  return `${category}_${country}`;
}

/**
 * Builds all 30 pipelines (10 countries x 3 categories). Deterministic given
 * the same settings — same seed every render, so server/client HTML match.
 * The `extraFailureCount` setting marks that many additional *filler*
 * pipelines (i.e. ones without a fixed named incident) as a generic,
 * auto-resolved transient failure, which is what makes "failed pipelines"
 * genuinely respond to the settings panel instead of being static.
 */
export function buildPipelineSummaries(settings: OverviewSettings = DEFAULT_OVERVIEW_SETTINGS): PipelineSummary[] {
  const rand = seededRandom("sentinel-pipelines-v1");
  const fillerKeys: string[] = [];

  const summaries: PipelineSummary[] = [];

  for (const country of COUNTRIES) {
    for (const cat of CATEGORIES) {
      const key = pipelineKey(cat.id, country.code);
      const def = getPipeline(cat.id);
      const fixed = FIXED_INCIDENT_EXAMPLES[key];
      const owner = fixed?.owner ?? seededPick(rand, PEOPLE).name;

      if (!fixed) fillerKeys.push(key);

      const baseDuration = Math.round(seededFloat(rand, settings.avgRuntimeMinutes * 0.6, settings.avgRuntimeMinutes * 1.1));
      const durationMinutes = fixed ? fixed.durationOverrideMinutes : baseDuration;
      const status: PipelineExecutionStatus = fixed ? fixed.pipelineStatus : "SUCCESS";

      const [hh, mm] = cat.scheduledTime.split(":").map(Number);
      const scheduled = new Date(Date.UTC(2026, 8, 29, hh, mm, 0));
      const actualCompletion = durationMinutes !== null ? new Date(scheduled.getTime() + durationMinutes * 60000) : null;

      summaries.push({
        id: key,
        category: cat.id,
        name: `${country.label} – ${cat.label}`,
        country: country.code,
        status,
        lastRunId: `RUN-${key}-${seededInt(rand, 1000, 9999)}`,
        scheduledTime: scheduled.toISOString(),
        actualCompletionTime: actualCompletion ? actualCompletion.toISOString() : null,
        durationMinutes,
        avgRuntimeMinutes: settings.avgRuntimeMinutes,
        maxRuntimeMinutes: settings.maxRuntimeMinutes,
        slaMinutes: cat.slaMinutes,
        owner,
        ownerEmail: emailFor(owner),
        incidentId: fixed?.incidentId ?? null,
        sourceTables: def?.sourceTables ?? [],
        targetTable: def?.targetTable ?? "",
        healthScore: computeHealthScore(durationMinutes, settings.avgRuntimeMinutes, settings.maxRuntimeMinutes),
        optimizationRequired: isOptimizationRequired(durationMinutes, settings.avgRuntimeMinutes),
      });
    }
  }

  // Apply the configurable extra-failure count on top of a stable, seeded
  // ordering of the filler pipelines, so "which ones fail" doesn't jump
  // around as the count changes by more than the delta.
  const orderedFillers = seededShuffle(rand, fillerKeys);
  const extraFailedKeys = new Set(orderedFillers.slice(0, Math.max(0, Math.min(5, settings.extraFailureCount))));

  return summaries.map((p) => {
    if (!extraFailedKeys.has(p.id)) return p;
    return {
      ...p,
      status: "FAILED",
      durationMinutes: null,
      actualCompletionTime: null,
      incidentId: `INC-AUTO-${p.id.slice(-6).toUpperCase()}`,
      healthScore: 0,
      optimizationRequired: false,
    };
  });
}

export const MOCK_PIPELINE_SUMMARIES: PipelineSummary[] = buildPipelineSummaries();
