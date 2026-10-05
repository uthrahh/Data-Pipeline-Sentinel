import { seededRandom } from "@/lib/seededRandom";

export type CountryCode = "CA" | "DE" | "GB" | "SG" | "US";
export type PipelineFamily = "MM" | "GOLD" | "PS";
export type WorkspaceId = "all" | "procurement-de" | "sales-de";

export interface Person {
  name: string;
  email: string;
}

export const COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: "CA", label: "Canada" },
  { code: "DE", label: "Germany" },
  { code: "GB", label: "United Kingdom" },
  { code: "SG", label: "Singapore" },
  { code: "US", label: "United States" },
];

export const COUNTRY_LABEL: Record<CountryCode, string> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.label])) as Record<CountryCode, string>;

export interface Workspace {
  id: WorkspaceId;
  name: string;
  description: string;
}

export const WORKSPACES: Workspace[] = [
  { id: "all", name: "All Workspaces", description: "Every pipeline across both workspaces" },
  { id: "procurement-de", name: "Procurement DE", description: "Material Master and Procurement & Sales pipelines" },
  { id: "sales-de", name: "Sales DE", description: "Material supply & sales gold pipelines" },
];

export const WORKSPACE_BY_ID: Record<WorkspaceId, Workspace> = Object.fromEntries(WORKSPACES.map((w) => [w.id, w])) as Record<WorkspaceId, Workspace>;

/** The pool of pipeline owners — escalation emails go to whoever owns the affected pipeline. */
export const PEOPLE: Person[] = [
  { name: "Tomas Alvarez", email: "tomas.alvarez@sentinel.ai" },
  { name: "Ravi Kimura", email: "ravi.kimura@sentinel.ai" },
  { name: "Priya Reddy", email: "priya.reddy@sentinel.ai" },
  { name: "Lea Fontaine", email: "lea.fontaine@sentinel.ai" },
  { name: "Sade Okafor", email: "sade.okafor@sentinel.ai" },
  { name: "Marc Dubois", email: "marc.dubois@sentinel.ai" },
  { name: "Anil Singh", email: "anil.singh@sentinel.ai" },
  { name: "Jun Nakamura", email: "jun.nakamura@sentinel.ai" },
];

export interface PipelineDef {
  id: string;
  name: string;
  family: PipelineFamily;
  country: CountryCode;
  jobId: string;
  owner: Person;
  workspaceId: Exclude<WorkspaceId, "all">;
  runsPerDay: number;
}

const FAMILY_NAME: Record<PipelineFamily, (c: CountryCode) => string> = {
  MM: (c) => `Material Master Processing ${c}`,
  GOLD: (c) => `material_supply_sales_gold_${c}`,
  PS: (c) => `Procurement & Sales Processing ${c}`,
};

/** 40 runs per day in total: US pipelines run most often, the rest run once or twice. */
const RUNS_PER_DAY: Record<CountryCode, Record<PipelineFamily, number>> = {
  US: { MM: 8, PS: 8, GOLD: 2 },
  CA: { MM: 2, PS: 2, GOLD: 2 },
  DE: { MM: 2, PS: 2, GOLD: 2 },
  GB: { MM: 2, PS: 2, GOLD: 2 },
  SG: { MM: 2, PS: 1, GOLD: 1 },
};

const FAMILIES: PipelineFamily[] = ["MM", "GOLD", "PS"];

function jobIdFor(name: string): string {
  const rand = seededRandom(`job:${name}`);
  let id = String(1 + Math.floor(rand() * 9));
  for (let i = 0; i < 14; i += 1) id += String(Math.floor(rand() * 10));
  return id;
}

export const PIPELINES: PipelineDef[] = COUNTRIES.flatMap((c, ci) =>
  FAMILIES.map((family, fi) => {
    const name = FAMILY_NAME[family](c.code);
    return {
      id: `${family}_${c.code}`,
      name,
      family,
      country: c.code,
      jobId: jobIdFor(name),
      owner: PEOPLE[(ci * 3 + fi) % PEOPLE.length],
      workspaceId: family === "GOLD" ? "sales-de" : "procurement-de",
      runsPerDay: RUNS_PER_DAY[c.code][family],
    } satisfies PipelineDef;
  }),
);

export const PIPELINE_BY_ID: Record<string, PipelineDef> = Object.fromEntries(PIPELINES.map((p) => [p.id, p]));
export const PIPELINE_BY_NAME: Record<string, PipelineDef> = Object.fromEntries(PIPELINES.map((p) => [p.name, p]));

/** The static "now": all data is a fixed 7-day window ending today. */
export const DAYS = ["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06"] as const;
export const TODAY = DAYS[DAYS.length - 1];

/** Average pipeline runtime used as the SLA baseline. Anything above it is critical. */
export const SLA_BASELINE_MINUTES = 15;

export function inWorkspace(pipelineId: string, workspace: WorkspaceId): boolean {
  if (workspace === "all") return true;
  return PIPELINE_BY_ID[pipelineId]?.workspaceId === workspace;
}
