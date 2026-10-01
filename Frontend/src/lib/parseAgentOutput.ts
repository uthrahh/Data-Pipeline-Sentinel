export interface AgentOutputSection {
  title: string;
  items: string[];
}

/**
 * The real ai-dataops-assistant agents (investigation_agent, final_response_agent)
 * always prompt the LLM to answer in a fixed markdown shape: a `**Bold Header**`
 * line, followed by one or more `- bullet` lines. This parses that shape into
 * sections so the UI can render structured cards instead of a raw text dump —
 * nothing here invents content, it only re-groups the real agent's own text.
 * Falls back to a single untitled section if the text doesn't match the
 * expected shape, so unexpected agent output is never silently dropped.
 */
export function parseAgentOutput(raw: string | null | undefined): AgentOutputSection[] {
  if (!raw || !raw.trim()) return [];

  const lines = raw.split("\n");
  const sections: AgentOutputSection[] = [];
  let current: AgentOutputSection | null = null;
  const headerPattern = /^\s*\*\*(.+?)\*\*\s*$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headerMatch = line.match(headerPattern);
    if (headerMatch) {
      current = { title: headerMatch[1].trim(), items: [] };
      sections.push(current);
      continue;
    }

    const item = line.replace(/^[-*]\s+/, "").trim();
    if (!item) continue;

    if (!current) {
      current = { title: "Summary", items: [] };
      sections.push(current);
    }
    current.items.push(item);
  }

  if (sections.length === 0) {
    return [{ title: "Summary", items: [raw.trim()] }];
  }

  return sections;
}

/**
 * A single-line, markdown-free summary of structured agent output (its
 * section header plus the first bullet) — for places that need plain text
 * (audit timeline entries, the regression-test "final state" field) rather
 * than the full structured breakdown.
 */
export function summarizeAgentOutput(raw: string | null | undefined): string | null {
  const sections = parseAgentOutput(raw);
  if (sections.length === 0) return null;
  const [first] = sections;
  return first.items.length > 0 ? `${first.title} — ${first.items[0]}` : first.title;
}
