export type ChatRole = "user" | "assistant";

export type ChatResultCardType = "pipeline" | "incident" | "metric";

export interface ChatResultCard {
  type: ChatResultCardType;
  title: string;
  subtitle: string;
  status?: string;
  href: string;
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
}

export interface ChatSession {
  messages: ChatMessage[];
  status: "connected" | "connecting" | "offline";
}
