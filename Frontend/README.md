# Sentinel AI Pipeline — Frontend (static branch)

A fully static, no-backend build of the SAP pipeline observability and
incident console. Every page renders from deterministic, hand-authored or
once-snapshotted fixture data — there is no fetch, no API call, no
environment-driven backend switch. This is the branch deployed to Vercel.

## No live mode here, on purpose

`src/lib/liveMode.ts` hardcodes `USE_LIVE_API = false` — not env-driven —
specifically so this branch can never be accidentally pointed at a live
backend via a misconfigured env var on Vercel:

```ts
export const USE_LIVE_API = false;
```

The live, Databricks-backed versions of this same UI (fetching from a real
Databricks App) live on the `n-live` and `h-live` branches of this repo —
see those branches' READMEs for how they wire up live data.

```bash
npm install && npm run dev
# open http://localhost:3000
```

## What's in the fixtures

- **30 pipelines**: 10 countries (`src/config/sapPipelineConfig.ts`) × 3 SAP
  pipeline categories (material master, procurement, sales & manufacturing).
- **Data Quality**: 7 real table schemas pulled once from
  `ai_dataops_poc.sap_demo` in Unity Catalog and hardcoded as fixtures
  (`src/data/mock/dataQuality.ts`) — row counts, freshness, and DQ
  pass/fail are real snapshots, not invented.
- **Incidents**: 10 hand-authored incidents covering all 6 failure types
  (Transient Job Failure, Known Task Restart, Schema Change, Unknown Error,
  Data Quality Breach, Permission Issue), each modeling its own
  status-machine workflow end to end — investigation, DQ/SLA checks,
  regression test, notification, and audit trail
  (`src/data/mock/incidents.ts`).
- **People/owners**: 10 named people with emails
  (`src/data/mock/people.ts`); every pipeline has a real
  `ownerEmail`, and notification recipients are derived from whichever
  pipeline/incident they're attached to, not hardcoded per-notification.

`src/lib/incidentStore.ts` / `src/lib/notificationStore.ts` keep this data
in an in-memory, mutable store (via `useSyncExternalStore`) so the demo
interactions — approving a DQ breach, sending/rejecting a notification —
actually update the UI across pages, entirely client-side.

## Architecture

```
src/
  types/         Domain model (Pipeline, Incident, DQ, SLA, Notification, Audit, RegressionTest)
  lib/           liveMode.ts (hardcoded false), overviewSettings, lifecycle (incident
                 stepper), incidentStore/notificationStore, seededRandom (deterministic
                 PRNG — avoids Next.js SSR/client hydration mismatches)
  config/        sapPipelineConfig.ts — 10 countries × 3 pipeline categories
  data/mock/     All fixture data — the only data source on this branch
  components/    dashboard/ · pipeline/ · incident/ · layout/ · common/
  app/           Next.js App Router pages: /overview, /pipelines/health,
                 /incidents, /incidents/[incidentId], /data-quality, /notifications
```

## Deploying to Vercel

```bash
cd Frontend
vercel
```

Set **Root Directory** to `Frontend` in the Vercel project settings (this
repo is a monorepo with `Frontend/`/`Backend/` siblings — `vercel.json` in
this directory pins the build/install commands). No environment variables
are required.
