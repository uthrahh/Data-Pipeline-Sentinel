import { ApiError, apiClient } from "./apiClient";
import type { ChatMessage, ChatToolCall } from "@/types";

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface ChatService {
  sendMessage(content: string): Promise<{ toolCalls: ChatToolCall[]; reply: ChatMessage }>;
}

interface ChatEnvelope {
  success: boolean;
  data: { role: "assistant"; message: string };
}

/**
 * Genie is the only live integration in this app: every message is a POST to
 * the Databricks-hosted assistant's /api/chat (through this app's own
 * server-side proxy, so the browser never holds a Databricks credential).
 * Everything else in the UI is static demo data.
 */
class GenieChatService implements ChatService {
  async sendMessage(content: string): Promise<{ toolCalls: ChatToolCall[]; reply: ChatMessage }> {
    const toolCalls: ChatToolCall[] = [{ label: "Asking Genie", status: "done" }];
    let text: string;
    try {
      const res = await apiClient.post<ChatEnvelope>("/api/chat", { message: content });
      text = res.data.message;
    } catch (e) {
      text =
        e instanceof ApiError && e.status === 503
          ? "Genie isn't connected in this environment yet."
          : "Genie couldn't answer that right now. Please try again in a moment.";
    }
    return {
      toolCalls,
      reply: { id: id(), role: "assistant", content: text, timestamp: new Date().toISOString() },
    };
  }
}

export const chatService: ChatService = new GenieChatService();
