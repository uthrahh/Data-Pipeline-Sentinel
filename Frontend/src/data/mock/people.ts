export interface Person {
  name: string;
  email: string;
}

/**
 * The pool of pipeline owners. Every pipeline is assigned one of these as
 * its owner (pipelineSummaries.ts), and every incident/notification for
 * that pipeline is addressed to that same person — notifications always go
 * to whoever actually owns the affected pipeline, never a generic team alias.
 */
export const PEOPLE: Person[] = [
  { name: "T. Alvarez", email: "t.alvarez@sentinel.ai" },
  { name: "R. Kimura", email: "r.kimura@sentinel.ai" },
  { name: "P. Reddy", email: "p.reddy@sentinel.ai" },
  { name: "L. Fontaine", email: "l.fontaine@sentinel.ai" },
  { name: "S. Okafor", email: "s.okafor@sentinel.ai" },
  { name: "M. Dubois", email: "m.dubois@sentinel.ai" },
  { name: "A. Singh", email: "a.singh@sentinel.ai" },
  { name: "J. Nakamura", email: "j.nakamura@sentinel.ai" },
  { name: "C. Silva", email: "c.silva@sentinel.ai" },
  { name: "H. Muller", email: "h.muller@sentinel.ai" },
];

const byName = new Map(PEOPLE.map((p) => [p.name, p]));

export function emailFor(name: string | null | undefined): string {
  if (!name) return "unassigned@sentinel.ai";
  return byName.get(name)?.email ?? `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@sentinel.ai`;
}

/** "T. Alvarez <t.alvarez@sentinel.ai>" — how a recipient is displayed/addressed. */
export function formatRecipient(name: string | null | undefined): string {
  if (!name) return "Unassigned <unassigned@sentinel.ai>";
  return `${name} <${emailFor(name)}>`;
}
