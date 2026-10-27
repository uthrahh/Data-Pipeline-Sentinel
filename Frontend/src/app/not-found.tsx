import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="bg-atmosphere flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs tracking-[0.3em] text-text-tertiary">ERROR 404</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-[-0.04em] text-text-primary">This page isn&apos;t in the catalog.</h1>
      <p className="mt-3 max-w-md text-sm text-text-secondary">The address may have changed, or the pipeline or incident it pointed to is outside the 15-day window.</p>
      <Link
        href="/overview"
        className="mt-8 inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted"
      >
        <ArrowLeft className="size-4" /> Back to overview
      </Link>
    </main>
  );
}
