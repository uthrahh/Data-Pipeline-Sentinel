# Sentinel AI Pipeline

A Databricks pipeline monitoring and governed-remediation platform: live job
status, an incident queue backed by real failed runs, selective
remediation (a real re-run triggered via the Databricks Jobs API) — safe,
transient-looking failures are auto-remediated immediately, everything else
waits for human approval — and execution analytics.

**Live**: `https://sentinel-pipeline-frontend-7474652936146529.aws.databricksapps.com`
(Databricks-authenticated users only — see Deployment below)

## Two data modes

- **Mock mode** (default): realistic fixture data, no backend required.
  `npm install && npm run dev`, open http://localhost:3000.
- **Live mode**: real data from `../Backend` (see that project's README).
  Set in `.env.local`:
  ```
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_USE_LIVE_API=true
  ```
  Run the backend locally first (`cd ../Backend && uvicorn app:app --port 8000`).

Mock and live mode use the exact same components/hooks/pages — only the
`services/*Service.ts` implementation differs
(`Mock*Service` vs `Api*Service`), selected by `NEXT_PUBLIC_USE_LIVE_API`.

## Architecture

```
src/
  types/        Domain model (Pipeline, Incident, DQ, SLA, Remediation, Audit, Chat, Metrics)
  lib/           Pure helpers, incl. liveMode.ts (the USE_LIVE_API flag every
                 service/page reads) and lifecycle.ts (incident stepper — skips
                 Investigation/DQ/SLA/Recommendation steps entirely when a real,
                 minimal-backend incident has no agent analysis behind it)
  data/mock/     Mock-mode fixtures only
  services/      PipelineService, IncidentService, MetricsService, ChatService +
                 apiClient. Each has a Mock implementation (fixtures) and an Api
                 implementation (real backend calls) behind the same interface.
  hooks/         Data-fetching hooks (usePipelines, useIncident, ...) — identical
                 regardless of which service implementation is active.
  components/    dashboard/ · pipeline/ · incident/ · chat/ · layout/ · common/
  app/           Next.js App Router pages: /overview, /pipelines, /pipelines/[runId],
                 /incidents, /incidents/[incidentId], /remediation, /analytics
  app/api/proxy/ Server-side proxy to the backend — see "Deployment" below.
```

**Lifecycle modeled end-to-end:** Detect → Suggest (a plain, transparent
error_type → RETRY/ESCALATE rule, not an AI narrative — see
`Backend/services/incidents_service.py::_suggest_action`) → Approve
(auto-approved immediately for RETRY suggestions unless the job is HIGH
severity or has exhausted its auto-retry budget; human-in-the-loop for
everything else) → Remediate → Resolve. Mock-mode incidents additionally
model Investigate → DQ/SLA → Recommend stages with an AI-agent narrative;
live-mode incidents (real failed Databricks runs, no LLM agent behind them)
skip those stages rather than fake them — see `lib/lifecycle.ts`.

## Deployment

This app is deployed **two ways** simultaneously right now:

### 1. Databricks App (primary, team-only)

Runs as its own Databricks App (`sentinel-pipeline-frontend`), protected by
Databricks' own SSO — only users granted access in the workspace can open it.
Because the browser itself can never call the backend's Databricks App
directly (same SSO wall applies to it), this frontend's own server
(`src/app/api/proxy/[...path]/route.ts`) proxies every `/api/*` call:
it exchanges a service-principal `client_id`/`client_secret` for a
short-lived Databricks OAuth token server-side and forwards the request with
that token attached. The browser never sees any Databricks credential.

```bash
databricks apps create sentinel-pipeline-frontend -p sentinel-apps

databricks sync . "/Workspace/Users/<you>/sentinel-pipeline-frontend" \
  --exclude "node_modules/**" --exclude ".next/**" --exclude ".env.local" --full -p sentinel-apps

databricks apps deploy sentinel-pipeline-frontend \
  --source-code-path "/Workspace/Users/<you>/sentinel-pipeline-frontend" -p sentinel-apps
```

Databricks Apps auto-detects `package.json` and runs `npm install`; the
`app.yaml` `command` handles `npm run build && npm run start`.

**The `DATABRICKS_CLIENT_SECRET` gotcha** (cost real debugging time, worth
knowing): a secret referenced in `app.yaml` via `valueFrom` must first be
*attached to the app as a resource* through the API — declaring a
`resources:` block directly inside `app.yaml` does **not** work, it's
silently ignored. The working sequence is:

```bash
databricks secrets create-scope sentinel-pipeline -p sentinel-apps
databricks secrets put-secret sentinel-pipeline backend-client-secret --string-value '<secret>' -p sentinel-apps
databricks secrets put-acl sentinel-pipeline <frontend-app-service-principal-id> READ -p sentinel-apps

databricks apps update sentinel-pipeline-frontend --json \
  '{"resources":[{"name":"backend-client-secret","secret":{"scope":"sentinel-pipeline","key":"backend-client-secret","permission":"READ"}}]}' \
  -p sentinel-apps
```
Only *then* does `app.yaml`'s `env: - name: DATABRICKS_CLIENT_SECRET, valueFrom: "backend-client-secret"` resolve correctly. (Two other syntaxes were tried first and failed: a `resources:` block inline in `app.yaml` — accepted by the CLI with no error, but never actually attached, causing `invalid_client` at runtime; and a `{{secrets/scope/key}}` template string in `value` — passed through completely literally, unresolved.)

Required `app.yaml` env vars: `NEXT_PUBLIC_API_URL=/api/proxy`,
`NEXT_PUBLIC_USE_LIVE_API=true`, `DATABRICKS_HOST`, `DATABRICKS_APP_URL`
(the backend's URL), `DATABRICKS_CLIENT_ID` + `DATABRICKS_CLIENT_SECRET`
(the **backend** app's service-principal credentials — reused here, since
any principal already granted `CAN_USE` on the backend app and access to its
data works regardless of where it's calling from).

Granting team access: `databricks apps update-permissions sentinel-pipeline-frontend --json '{"access_control_list":[{"group_name":"users","permission_level":"CAN_USE"}]}'`

### 2. Vercel (optional, public)

The same codebase also deploys to Vercel unmodified. Same proxy mechanism —
`NEXT_PUBLIC_API_URL=/api/proxy` plus the four `DATABRICKS_*` server-side env
vars, set as Vercel project environment variables (**Root Directory must be
set to `Frontend`** in Vercel project settings, since this repo is a
monorepo with `Frontend/` and `Backend/` siblings). Can be safely removed if
the Databricks App is the only deployment target needed.

## Connecting a different backend

Set `NEXT_PUBLIC_API_URL` and implement `Api*Service` classes matching the
existing interfaces in `src/services/`. See `src/services/apiClient.ts` for
the fetch wrapper.
