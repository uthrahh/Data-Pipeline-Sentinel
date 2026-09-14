"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import { ChatPanel } from "./ChatPanel";

export function ChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close AI DataOps Assistant" : "Open AI DataOps Assistant"}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-50 flex size-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:right-6"
      >
        {open ? <X className="size-5" /> : <Bot className="size-5" />}
        {!open && <span className="absolute right-1 top-1 size-2 rounded-full bg-success-500 ring-2 ring-accent-500" />}
      </button>

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  );
}
