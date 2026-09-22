import type { AgentDefinition, AgentId } from "@/types";

/**
 * The five agents named in the product deck ("Data Pipeline Sentinel based
 * on multi agents"). Every panel that displays agent-generated content
 * attributes itself to one of these via <AgentBadge agentId="..." /> rather
 * than hardcoding a name — add or rename an agent here and every
 * attribution updates.
 */
export const AGENTS: Record<AgentId, AgentDefinition> = {
  genie: {
    id: "genie",
    name: "Genie Agent",
    role: "Natural-language business Q&A over governed data",
  },
  issue_investigation: {
    id: "issue_investigation",
    name: "Issue Investigation Agent",
    role: "Identifies and explains the reason for missing, delayed, or failed data",
  },
  sla_monitoring: {
    id: "sla_monitoring",
    name: "SLA Monitoring Agent",
    role: "Monitors critical data availability timelines",
  },
  data_quality: {
    id: "data_quality",
    name: "Data Quality Agent",
    role: "Checks whether available data is complete and meets expected quality standards",
  },
  action: {
    id: "action",
    name: "Action Agent",
    role: "Performs approved corrective actions and confirms the result",
  },
};

export function getAgent(id: AgentId): AgentDefinition {
  return AGENTS[id];
}
