import { Bot } from "lucide-react";
import type { AgentId } from "@/types";
import { getAgent } from "@/config/agentConfig";
import { cn } from "@/lib/utils";

/**
 * Attributes a section or action to the specialized agent that produced it —
 * the multi-agent identity is the core of the product story, so every
 * agent-generated panel should carry one of these rather than reading as
 * anonymous system output.
 */
export function AgentBadge({ agentId, className }: { agentId: AgentId; className?: string }) {
  const agent = getAgent(agentId);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium text-text-tertiary",
        className,
      )}
      title={agent.role}
    >
      <Bot className="size-3" />
      {agent.name}
    </span>
  );
}
