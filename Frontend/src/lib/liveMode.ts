/**
 * Single source of truth for whether the app is pulling from the live
 * Databricks-backed API (the separately-deployed `ai-dataops-assistant`
 * app — see services/liveApiService.ts) or the built-in mock fixtures.
 * Driven by NEXT_PUBLIC_USE_LIVE_API so local dev can still run against
 * fixtures without a backend, while the deployed Databricks App sets it
 * true (see app.yaml).
 */
export const USE_LIVE_API = process.env.NEXT_PUBLIC_USE_LIVE_API === "true";
