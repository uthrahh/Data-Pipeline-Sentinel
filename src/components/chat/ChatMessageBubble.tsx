import { Bot, Wrench } from "lucide-react";
import type { ChatMessage } from "@/types";
import { cn, formatTime } from "@/lib/utils";
import { ChatResultCard } from "./ChatResultCard";
import { ChatQueryResultTable } from "./ChatQueryResultTable";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent-500 px-3.5 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white">
        <Bot className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {message.isLoading ? (
          <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-surface-muted px-3.5 py-2.5">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-text-tertiary [animation-delay:0ms]" />
            <span className="size-1.5 animate-pulse-dot rounded-full bg-text-tertiary [animation-delay:150ms]" />
            <span className="size-1.5 animate-pulse-dot rounded-full bg-text-tertiary [animation-delay:300ms]" />
          </div>
        ) : (
          <>
            {message.toolCalls && message.toolCalls.length > 0 && (
              <div className="space-y-1">
                {message.toolCalls.map((tc, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                    <Wrench className="size-3" />
                    {tc.label}
                  </div>
                ))}
              </div>
            )}
            <div className={cn("max-w-full rounded-2xl rounded-tl-sm bg-surface-muted px-3.5 py-2.5 text-sm text-text-primary")}>
              {message.content}
            </div>
            {message.queryResult && (
              <div className="pt-0.5">
                <ChatQueryResultTable result={message.queryResult} />
              </div>
            )}
            {message.resultCards && message.resultCards.length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                {message.resultCards.map((card, i) => (
                  <ChatResultCard key={i} card={card} />
                ))}
              </div>
            )}
          </>
        )}
        <p className="px-1 text-[10px] text-text-tertiary">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  );
}
