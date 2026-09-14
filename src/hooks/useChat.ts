"use client";

import { useCallback, useState } from "react";
import { chatService } from "@/services/chatService";
import type { ChatMessage } from "@/types";

function id(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: id(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const pendingId = id();
    const pendingMessage: ChatMessage = {
      id: pendingId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, pendingMessage]);
    setIsSending(true);

    try {
      const { toolCalls, reply } = await chatService.sendMessage(trimmed);
      setMessages((prev) =>
        prev.map((m) => (m.id === pendingId ? { ...reply, id: pendingId, toolCalls } : m)),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, isLoading: false, content: "Something went wrong reaching the assistant. Please try again." }
            : m,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }, []);

  return { messages, sendMessage, isSending };
}
