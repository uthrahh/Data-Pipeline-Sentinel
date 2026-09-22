/**
 * Single source of truth for whether the app is pulling from the live
 * Databricks-backed API (NEXT_PUBLIC_USE_LIVE_API=true in .env.local) or the
 * built-in mock fixtures. Services use this to pick their implementation;
 * pages/components use it to decide whether to show data that genuinely
 * isn't backed by live data yet (e.g. incidents, pending a catalog grant).
 */
export const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === "true";
