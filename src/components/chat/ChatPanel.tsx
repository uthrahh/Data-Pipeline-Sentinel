"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, SendHorizontal, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { CHAT_ASSISTANT_NAME } from "@/data/mock/chat";

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const { messages, sendMessage, isSending } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const value = text ?? input;
    if (!value.trim() || isSending) return;
    sendMessage(value);
    setInput("");
  };

  return (
    <div
      className="fixed bottom-24 right-4 z-50 flex h-[min(640px,calc(100dvh-140px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-lg animate-slide-up sm:bottom-24 sm:right-6"
      role="dialog"
      aria-label="AI DataOps Assistant"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-navy-950 px-4 py-3.5 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-accent-500">
            <Bot className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{CHAT_ASSISTANT_NAME}</p>
            <p className="flex items-center gap-1 text-[11px] text-white/60">
              <span className="size-1.5 rounded-full bg-success-500" />
              Connected · Ready
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close assistant"
          className="flex size-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-text-primary">Hi — I&apos;m your DataOps copilot.</p>
              <p className="text-xs leading-relaxed text-text-tertiary">
                Ask me about pipeline failures, DQ/SLA results, approvals, or active remediation.
              </p>
            </div>
            <SuggestedPrompts onSelect={handleSend} />
          </div>
        ) : (
          messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border-strong bg-surface-subtle px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Ask about a pipeline, incident, or SLA…"
            className="max-h-24 flex-1 resize-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-500 text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizontal className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
