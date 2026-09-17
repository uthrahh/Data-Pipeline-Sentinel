/**
 * The five specialized agents behind Sentinel AI Pipeline. Sections and
 * actions in the UI are attributed to the agent that produced them via
 * `config/agentConfig.ts` — components never hardcode an agent's name.
 */
export type AgentId = "genie" | "issue_investigation" | "sla_monitoring" | "data_quality" | "action";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  role: string;
}

export type ChatRole = "user" | "assistant";

export type ChatResultCardType = "pipeline" | "incident" | "metric";

export interface ChatResultCard {
  type: ChatResultCardType;
  title: string;
  subtitle: string;
  status?: string;
  href: string;
}

/**
 * A structured tabular answer to a data question (material master, vendor
 * pricing, sales orders, ...). Rendered as a table rather than prose so the
 * frontend stays extensible when the mock lookup is replaced by a real
 * Databricks SQL / Genie response carrying the same shape.
 */
export interface ChatQueryResult {
  sourceTable: string;
  columns: string[];
  rows: (string | number)[][];
  generatedSql?: string;
}

export interface ChatToolCall {
  label: string;
  status: "running" | "done";
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  isLoading?: boolean;
  toolCalls?: ChatToolCall[];
  resultCards?: ChatResultCard[];
  queryResult?: ChatQueryResult;
}

export interface ChatSession {
  messages: ChatMessage[];
  status: "connected" | "connecting" | "offline";
}
