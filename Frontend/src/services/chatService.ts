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
      if (e instanceof ApiError && e.status === 503) text = "Genie is not connected in this environment yet.";
      else if (e instanceof ApiError && (e.status === 502 || e.status === 504)) text = "Genie is not reachable right now. The assistant service may be stopped or restarting — please try again in a minute.";
      else if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")) text = "Genie took too long to answer. Please try again with a shorter question.";
      else text = "Genie could not answer that right now. Please try again.";
    }
    return {
      toolCalls,
      reply: { id: id(), role: "assistant", content: text, timestamp: new Date().toISOString() },
    };
  }
}

export const chatService: ChatService = new GenieChatService();
