import { seededInt, seededRandom, seededShuffle } from "@/lib/seededRandom";
import { DAYS, PIPELINES, PIPELINE_BY_ID, SLA_BASELINE_MINUTES, TODAY } from "./catalog";
import { buildEmail } from "./email";
import { FAILURE_BY_KEY, FAILURE_TYPES, type FailureKey } from "./failureTypes";
import type { AppNotification, AuditEvent, Incident, IncidentStatus, PipelineRun } from "./types";

interface Slot {
  pipelineId: string;
  k: number;
}

/** The 40 daily run slots, interleaved so each pipeline's runs are spread across the day. */
function buildSlots(): Slot[] {
  return PIPELINES.flatMap((p, pi) =>
    Array.from({ length: p.runsPerDay }, (_, k) => ({ pipelineId: p.id, k, key: (k + 0.5) / p.runsPerDay + pi * 0.0007 })),
  )
    .sort((a, b) => a.key - b.key)
    .map(({ pipelineId, k }) => ({ pipelineId, k }));
}

const SLOTS = buildSlots();

/** Today's 18 failed runs: every one of the 14 failure types appears, plus 4 repeats on other pipelines/countries. */
const TODAY_PLAN: Record<string, FailureKey> = {
  "MM_US#0": "TRANSIENT_INFRASTRUCTURE",
  "PS_US#0": "TEMPORARY_EXECUTION_FAILURE",
  "MM_US#1": "SOURCE_FILE_UNAVAILABLE",
  "PS_US#1": "DQ_FAILURE",
  "MM_US#2": "REPEATED_FAILURE",
  "PS_US#2": "UNKNOWN",
  "MM_US#4": "SCHEMA_MISMATCH",
  "PS_US#3": "PERMISSION_FAILURE",
  "MM_US#5": "RESOURCE_EXHAUSTION",
  "PS_US#4": "TIMEOUT_FAILURE",
  "MM_US#6": "DEPENDENCY_FAILURE",
  "PS_US#6": "SLA_BREACH",
  "MM_US#7": "DATA_CORRUPTION",
  "PS_US#7": "CONFIGURATION_FAILURE",
  "MM_CA#0": "TRANSIENT_INFRASTRUCTURE",
  "PS_DE#1": "DQ_FAILURE",
  "GOLD_GB#0": "SCHEMA_MISMATCH",
  "GOLD_SG#0": "TIMEOUT_FAILURE",
};

/** Failed runs per earlier day (index matches DAYS). */
const PAST_FAILURES = [14, 16, 13, 17, 15, 12];

/** Incidents from earlier days that are still open (they count towards "active incidents"). */
const CARRY_OVER: Record<number, { key: FailureKey; status: IncidentStatus }[]> = {
  5: [
    { key: "PERMISSION_FAILURE", status: "WAITING_APPROVAL" },
    { key: "DATA_CORRUPTION", status: "WAITING_APPROVAL" },
    { key: "UNKNOWN", status: "ESCALATED" },
    { key: "RESOURCE_EXHAUSTION", status: "WAITING_APPROVAL" },
  ],
  4: [
    { key: "REPEATED_FAILURE", status: "ESCALATED" },
    { key: "SCHEMA_MISMATCH", status: "WAITING_APPROVAL" },
    { key: "DQ_FAILURE", status: "WAITING_APPROVAL" },
  ],
  3: [{ key: "UNKNOWN", status: "ESCALATED" }],
  2: [{ key: "CONFIGURATION_FAILURE", status: "WAITING_APPROVAL" }],
};

const HEX = "0123456789ABCDEF";

function hex(rand: () => number, n: number): string {
  let out = "";
  for (let i = 0; i < n; i += 1) out += HEX[Math.floor(rand() * 16)];
  return out;
}

function digits(rand: () => number, n: number): string {
  let out = String(1 + Math.floor(rand() * 9));
  for (let i = 1; i < n; i += 1) out += String(Math.floor(rand() * 10));
  return out;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function iso(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${String(d.getUTCMilliseconds()).padStart(3, "0")}Z`;
}

interface FailurePlanEntry {
  key: FailureKey;
  status: IncidentStatus;
}

/** slot index -> planned failure (with the status its incident should start in). */
function planFailures(dayIdx: number): Map<number, FailurePlanEntry> {
  const plan = new Map<number, FailurePlanEntry>();

  if (DAYS[dayIdx] === TODAY) {
    SLOTS.forEach((slot, i) => {
      const key = TODAY_PLAN[`${slot.pipelineId}#${slot.k}`];
      if (key) plan.set(i, { key, status: FAILURE_BY_KEY[key].autoRun ? "RESOLVED" : "WAITING_APPROVAL" });
    });
    return plan;
  }

  const rand = seededRandom(`failures:${DAYS[dayIdx]}`);
  const order = seededShuffle(rand, SLOTS.map((_, i) => i)).slice(0, PAST_FAILURES[dayIdx]);
  const forced = CARRY_OVER[dayIdx] ?? [];
  const typeCycle = seededShuffle(rand, FAILURE_TYPES.map((f) => f.key));
  let cycle = 0;
  let resolvedCount = 0;

  order.forEach((slotIdx, n) => {
    if (n < forced.length) {
      plan.set(slotIdx, forced[n]);
      return;
    }
    const key = typeCycle[cycle % typeCycle.length];
    cycle += 1;
    resolvedCount += 1;
    const rejected = !FAILURE_BY_KEY[key].autoRun && resolvedCount % 9 === 4;
    plan.set(slotIdx, { key, status: rejected ? "REJECTED" : "RESOLVED" });
  });
  return plan;
}

function buildAudit(incident: Incident, status: IncidentStatus, rand: () => number): AuditEvent[] {
  const def = FAILURE_BY_KEY[incident.failureKey];
  const t0 = new Date(incident.detectedAt).getTime();
  const at = (min: number) => iso(t0 + min * 60000);
  const ev = (n: number, min: number, label: string, actor: AuditEvent["actor"], detail: string | null): AuditEvent => ({
    id: `${incident.id}-${n}`,
    timestamp: at(min),
    label,
    actor,
    detail,
  });

  const events: AuditEvent[] = [
    ev(1, 0, "Incident created", "system", def.errorMessage),
    ev(2, 1, "AI investigation completed", "ai", def.rootCause),
    ev(3, 2, `Failure type identified: ${def.label}`, "ai", `Recommended action: ${def.recommendation}`),
  ];

  if (status === "WAITING_APPROVAL") {
    events.push(ev(4, 3, def.autoRemediable ? "Waiting for human approval" : "Escalation required", "system", def.autoRemediable ? def.remediationLabel : "No safe automated action — a human must investigate"));
  } else if (status === "ESCALATED") {
    events.push(ev(4, 3, "Escalation required", "system", "No safe automated action — a human must investigate"));
  } else if (status === "REJECTED") {
    events.push(ev(4, 3, "Waiting for human approval", "system", def.remediationLabel));
    events.push(ev(5, 18 + seededInt(rand, 0, 12), "Remediation rejected", "human", `By ${incident.owner.name}`));
  } else if (status === "RESOLVED") {
    const started = 18 + seededInt(rand, 0, 12);
    if (def.autoRun) {
      events.push(ev(4, 3, `Auto-remediation started: ${def.remediationLabel}`, "system", "Guardrail allows an automatic rerun — no approval required"));
      events.push(ev(5, 4, "Pipeline started in Databricks", "system", `Remediation run ${incident.remediationRunId ?? ""}`.trim()));
      events.push(ev(6, 16, "Validation passed — incident resolved automatically", "system", def.validation[0]));
    } else if (def.autoRemediable) {
      events.push(ev(4, 3, "Waiting for human approval", "system", def.remediationLabel));
      events.push(ev(5, started, "Remediation approved", "human", `By ${incident.owner.name}`));
      events.push(ev(6, started + 1, `Remediation started: ${def.remediationLabel}`, "system", "Job run started in Databricks"));
      events.push(ev(7, started + 12, "Validation passed — incident resolved", "system", def.validation[0]));
    } else {
      events.push(ev(4, 3, "Escalation required", "system", "No safe automated action — a human must investigate"));
      events.push(ev(5, started + 20, "Owner fixed the root cause", "human", `By ${incident.owner.name}`));
      events.push(ev(6, started + 35, "Incident resolved", "system", "Pipeline recovered after manual fix"));
    }
  }
  return events;
}

export const SEED_RUNS: PipelineRun[] = [];
export const SEED_INCIDENTS: Incident[] = [];
export const SEED_NOTIFICATIONS: AppNotification[] = [];

function generate() {
  const emailRand = seededRandom("emails");

  DAYS.forEach((day, dayIdx) => {
    const rand = seededRandom(`day:${day}`);
    const plan = planFailures(dayIdx);
    const base = Date.parse(`${day}T00:00:00.000Z`);
    let successSeen = 0;

    SLOTS.forEach((slot, i) => {
      const p = PIPELINE_BY_ID[slot.pipelineId];
      const planned = plan.get(i);
      const def = planned ? FAILURE_BY_KEY[planned.key] : null;

      const startMs = base + (12 + i * 35 + seededInt(rand, 0, 8)) * 60000 + seededInt(rand, 0, 59) * 1000 + seededInt(rand, 0, 999);
      let duration: number;
      if (def) {
        duration = def.failMinutes;
      } else {
        const criticalSuccess = day === TODAY ? successSeen === 3 || successSeen === 9 : rand() < 0.06;
        duration = criticalSuccess ? 16 + (successSeen % 4) : seededInt(rand, 7, 14);
        successSeen += 1;
      }
      const endMs = startMs + duration * 60000 + seededInt(rand, 0, 40) * 1000;
      const runId = digits(rand, 15);
      const incidentId = def ? `INC-${hex(rand, 8)}` : null;

      const run: PipelineRun = {
        date: day,
        pipelineId: p.id,
        pipeline: p.name,
        country: p.country,
        family: p.family,
        jobId: p.jobId,
        runId,
        startTime: iso(startMs),
        endTime: iso(endMs),
        durationMinutes: duration,
        executionStatus: def ? def.executionStatus : "SUCCESS",
        triggerType: rand() < 0.15 ? "ONE_TIME" : "PERIODIC",
        runType: "JOB_RUN",
        detectedAt: iso(endMs + 60000),
        incidentId,
        dqStatus: def ? (def.key === "DQ_FAILURE" || def.key === "DATA_CORRUPTION" ? "FAIL" : "N/A") : "PASS",
        slaStatus: duration > SLA_BASELINE_MINUTES ? "CRITICAL" : "SAFE",
      };
      SEED_RUNS.push(run);

      if (!def || !planned || !incidentId) return;

      const incident: Incident = {
        id: incidentId,
        runId,
        pipelineId: p.id,
        pipeline: p.name,
        country: p.country,
        jobId: p.jobId,
        owner: p.owner,
        failureKey: def.key,
        detectedAt: run.detectedAt,
        date: day,
        status: planned.status,
        severity: run.slaStatus === "CRITICAL" ? "CRITICAL" : def.baseSeverity,
        executionStatus: run.executionStatus,
        durationMinutes: duration,
        slaStatus: run.slaStatus,
        approvedBy: planned.status === "RESOLVED" ? (def.autoRun ? "auto-remediation" : p.owner.name) : null,
        approvedAt: null,
        rejectedBy: planned.status === "REJECTED" ? p.owner.name : null,
        remediationRunId: planned.status === "RESOLVED" && def.autoRemediable ? digits(rand, 15) : null,
        remediationStartedAt: null,
        resolvedAt: planned.status === "RESOLVED" ? iso(Date.parse(run.detectedAt) + 40 * 60000) : null,
        emailSent: false,
        audit: [],
      };

      const emailed =
        day !== TODAY &&
        (!def.autoRemediable || incident.severity === "CRITICAL" || planned.status === "ESCALATED" || planned.status === "REJECTED" || emailRand() < 0.3);

      incident.audit = buildAudit(incident, planned.status, rand);

      if (emailed) {
        const draft = buildEmail(incident);
        const kind = !def.autoRemediable || incident.severity === "CRITICAL" || planned.status === "ESCALATED" ? "Escalation" : "Email";
        const sentAt = iso(Date.parse(run.detectedAt) + seededInt(rand, 5, 25) * 60000);
        incident.emailSent = true;
        incident.audit.push({
          id: `${incident.id}-mail`,
          timestamp: sentAt,
          label: kind === "Escalation" ? "Escalation email sent" : "Email sent",
          actor: "system",
          detail: `To ${draft.toName} <${draft.to}>`,
        });
        SEED_NOTIFICATIONS.push({
          id: "",
          incidentId: incident.id,
          kind,
          subject: draft.subject,
          reason: draft.reason,
          recipient: incident.owner,
          cc: draft.cc,
          failureKey: incident.failureKey,
          pipeline: incident.pipeline,
          sentAt,
          sentBy: "Sentinel AI",
          body: draft.body,
          resolution: draft.resolution,
        });
      }
      incident.audit.sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
      SEED_INCIDENTS.push(incident);
    });
  });

  SEED_NOTIFICATIONS.sort((a, b) => (a.sentAt < b.sentAt ? -1 : 1)).forEach((n, i) => {
    n.id = `NTF-${String(1001 + i)}`;
  });
  SEED_NOTIFICATIONS.reverse();
  SEED_RUNS.sort((a, b) => (a.startTime < b.startTime ? 1 : -1));
  SEED_INCIDENTS.sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));
}

generate();
