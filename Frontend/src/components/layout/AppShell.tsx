"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { useOps } from "@/ops/store";

function PageSkeleton() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Loading">
      <div className="border-b border-border bg-surface px-4 py-5 sm:px-6">
        <div className="h-6 w-48 animate-pulse rounded bg-surface-muted" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  // The demo data is generated in the browser so the 7-day window always ends on the viewer's current date.
  const { ready } = useOps();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-surface-subtle">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto">{ready ? children : <PageSkeleton />}</main>
      </div>
      <ChatLauncher />
    </div>
  );
}
