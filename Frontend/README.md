# Sentinel AI Pipeline — Frontend

A pipeline observability and incident console for SAP-sourced Databricks
pipelines. Overview, Pipeline Health, and Incidents fetch real, live data
from a separately-deployed Databricks agent system (`ai-dataops-assistant`);
Data Quality and Notifications are static, grounded in real snapshotted
table metadata.

**Live**: `https://sentinel-pipeline-frontend-7474652936146529.aws.databricksapps.com`
(Databricks-authenticated users only — see Deployment below)

## Two data modes

- **Mock mode** (default locally): every page — Overview, Pipeline Health,
  Incidents, Data Quality, Notifications — uses built-in fixtures
  (`src/data/mock/`). No network calls, no Databricks needed.
  `npm install && npm run dev`, open http://localhost:3000.
- **Live mode** (`NEXT_PUBLIC_USE_LIVE_API=true`, set in the deployed
  `app.yaml`): Overview, Pipeline Health, and Incidents fetch real data from
  `ai-dataops-assistant`, a separate Databricks App owned by another team
  (see [Live data source](#live-data-source) below). Data Quality and
  Notifications stay on fixtures in both modes — they were never wired to a
  live backend.

Each live-capable route exports two components and branches on the
`USE_LIVE_API` flag at the bottom of the file, e.g.
`overview/page.tsx`'s `MockOverview()` / `LiveOverview()`:

```ts
export default function OverviewPage() {
  return USE_LIVE_API ? <LiveOverview /> : <MockOverview />;
}
```

## Live data source

`ai-dataops-assistant` is a separate, already-existing Databricks App that
runs its own multi-agent incident pipeline (detection, investigation,
DQ/SLA checks, remediation guardrails) against `ai_dataops_poc.dataops.*`
Delta tables, and exposes a real FastAPI surface. This frontend calls it
**read-only**:

| Function (`src/services/liveApiService.ts`) | Endpoint | Used by |
|---|---|---|
| `fetchDashboard()` | `GET /api/dashboard` | Overview (pipeline ops + active incidents + history, one call) |
| `fetchPipelineOperations()` | `GET /api/pipeline-operations` | Pipeline Health |
| `fetchActiveIncidents()` / `fetchIncidentHistory()` | `GET /api/incidents/active` / `/history` | Incidents list |
| `fetchIncidentDetail(id)` | `GET /api/incidents/{id}` | Incident detail (raw investigation text) |
| `fetchIncidentChecks(id)` | `GET /api/incidents/{id}/checks` | Incident detail (DQ/SLA sub-results) |

That API's own `/api/pipeline-operations` and `/api/incidents/active` only
look back a trailing 24-hour window (its choice, not ours), so Overview and
Pipeline Health can legitimately show an empty state when nothing recent has
run — that's real current state, not a bug.

**Approve/reject/remediate are deliberately not wired up.** Those endpoints
exist on `ai-dataops-assistant` too, but it's a shared system this repo
doesn't own, and those actions have real side effects (real job reruns,
real table mutations). Only GET calls are made.

`src/lib/mapLiveIncident.ts` adapts the real API's row shapes
(`src/types/live.ts`) into this app's display types. It deliberately does
**not** populate the mock model's structured `Investigation` object
(`confidencePct`, `evidence[]`, `impact`, ...) for live incidents — the real
API doesn't return those fields, and fabricating them would misrepresent
what the agent actually said. Instead, the incident detail page renders the
real API's raw `investigation_result` text as-is, in its own
"AI Investigation (raw agent output)" panel.

## Architecture

```
src/
  types/         Domain model (Pipeline, Incident, DQ, SLA, Notification, Audit) +
                 live.ts (exact real ai-dataops-assistant row shapes)
  lib/           Pure helpers, incl. liveMode.ts (the USE_LIVE_API flag every live
                 page reads), mapLiveIncident.ts (real row -> display Incident),
                 liveOverviewMetrics.ts (KPI math over real dashboard data),
                 incidentStore.ts (in-memory store; live-hydrates from
                 ai-dataops-assistant when USE_LIVE_API, seeds from fixtures otherwise)
  data/mock/     Fixtures: sap_demo-grounded pipelines/incidents/DQ tables/people,
                 used in mock mode everywhere, and always for Data Quality/Notifications
  services/      liveApiService.ts (real calls) + apiClient (proxy-aware fetch wrapper)
  hooks/         useLiveDashboard, usePipelines, ... — data-fetching hooks
  components/    dashboard/ · pipeline/ · incident/ · layout/ · common/
  app/           Next.js App Router pages: /overview, /pipelines/health,
                 /incidents, /incidents/[incidentId], /data-quality, /notifications
  app/api/proxy/ Server-side proxy to ai-dataops-assistant — see "Deployment" below.
```

## Deployment

Runs as a single Databricks App (`sentinel-pipeline-frontend`), protected by
Databricks' own SSO. Because the browser can never call another workspace
app directly (same SSO wall applies), this app's own server
(`src/app/api/proxy/[...path]/route.ts`) proxies every `/api/*` call: it
exchanges a service-principal `client_id`/`client_secret` for a short-lived
Databricks OAuth token server-side and forwards the request, with that
token attached, to `DATABRICKS_APP_URL`. The browser never sees any
Databricks credential.

```bash
databricks apps create sentinel-pipeline-frontend -p sentinel-apps

databricks sync . "/Workspace/Users/<you>/sentinel-pipeline-frontend" \
  --exclude "node_modules/**" --exclude ".next/**" --exclude ".env.local" --full -p sentinel-apps

databricks apps deploy sentinel-pipeline-frontend \
  --source-code-path "/Workspace/Users/<you>/sentinel-pipeline-frontend" -p sentinel-apps
```

Databricks Apps auto-detects `package.json` and runs `npm install`; the
`app.yaml` `command` handles `npm run build && npm run start`.

**Required `app.yaml` env vars:**

```yaml
env:
  - name: "NEXT_PUBLIC_API_URL"
    value: "/api/proxy"
  - name: "NEXT_PUBLIC_USE_LIVE_API"
    value: "true"
  - name: "DATABRICKS_HOST"
    value: "https://dbc-fa603402-4338.cloud.databricks.com"
  - name: "DATABRICKS_APP_URL"
    value: "https://ai-dataops-assistant-7474652936146529.aws.databricksapps.com"
  - name: "DATABRICKS_CLIENT_ID"
    value: "<service principal client id — see below>"
  - name: "DATABRICKS_CLIENT_SECRET"
    valueFrom: "backend-client-secret"
```

The `DATABRICKS_CLIENT_ID`/`DATABRICKS_CLIENT_SECRET` pair must belong to a
service principal that has been granted `CAN_USE` on the
`ai-dataops-assistant` app (an *additive* grant — use
`apps update-permissions`, not `set-permissions`, so you don't wipe that
app's existing team ACL):

```bash
databricks apps update-permissions ai-dataops-assistant --json \
  '{"access_control_list":[{"service_principal_name":"<your-sp-application-id>","permission_level":"CAN_USE"}]}' \
  -p sentinel-apps
```

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

Granting team access to this frontend app itself:
`databricks apps update-permissions sentinel-pipeline-frontend --json '{"access_control_list":[{"group_name":"users","permission_level":"CAN_USE"}]}'`

### Verifying live fetch is actually working

Open the deployed app, DevTools → Network → Fetch/XHR, reload `/overview`
or `/incidents`. You should see requests to `/api/proxy/api/dashboard`,
`/api/proxy/api/incidents/active`, etc. returning real JSON — if that list
is empty, live mode isn't reaching the proxy (check `NEXT_PUBLIC_USE_LIVE_API`
and the OAuth env vars above).

## Connecting a different live backend

Point `DATABRICKS_APP_URL` at a different Databricks App and adjust
`src/services/liveApiService.ts` + `src/types/live.ts` +
`src/lib/mapLiveIncident.ts` to match its response shapes. The proxy route
and OAuth exchange are generic — they work against any Databricks App the
configured service principal has `CAN_USE` on.
