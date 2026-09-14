import { SUGGESTED_PROMPTS } from "@/data/mock/chat";

export function SuggestedPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">Try asking</p>
      {SUGGESTED_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs text-text-secondary transition-colors hover:border-accent-500/40 hover:bg-accent-50/40 hover:text-text-primary"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
