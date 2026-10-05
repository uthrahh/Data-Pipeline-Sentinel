# Sentinel AI Pipeline — Frontend (`static`)

Static demo of the SAP pipeline operations console, hosted as a **Databricks App**. All pages render deterministic demo data; **Genie** (the chat assistant) is the only live integration.

See the [root README](../README.md) for what each page does. This file covers the code layout and deployment.

## Data model (`src/ops`)

| File | Purpose |
|---|---|
| `catalog.ts` | 15 pipelines (3 families × 5 countries: CA, DE, GB, SG, US), owners, workspaces (All / Procurement DE / Sales DE), the 7-day window, the 15-minute SLA baseline |
| `failureTypes.ts` | The 14 failure types: recommendation, remediation, root cause, investigation steps, remediation/validation steps, planned change (e.g. compute 2 → 4 workers), solution text, regression-test definition |
| `data.ts` | Deterministic generator: 40 runs per day × 7 days, incidents for every failed run (18 today, covering all 14 types), 6 carried-over open incidents (so 24 active), and the last 7 days of sent emails |
| `store.ts` | In-memory store (`useSyncExternalStore`): workspace selection, **approve & remediate** (starts a simulated Databricks run, validates, resolves), **reject**, **send email** |
| `email.ts` | Builds each email from the incident — reason plus the solution for its failure type |
| `validation.ts` | The 7 tables and the 10 data quality checks; running a check returns a random, threshold-consistent result |

Data is seeded with a fixed PRNG so server and client render identically (no hydration mismatches). "Today" is the last day in the window (2026-10-06).

## Genie (the live part)

`src/services/chatService.ts` POSTs `{ "message": … }` to `${NEXT_PUBLIC_API_URL}/api/chat` and renders `data.message`. Errors degrade to a friendly message.

- **Local:** `.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000` (any server implementing that endpoint).
- **Databricks App:** `NEXT_PUBLIC_API_URL=/api/proxy`. The proxy (`src/app/api/proxy/[...path]/route.ts`) exchanges a service-principal `client_id`/`client_secret` for a short-lived OAuth token server-side and forwards **only** `POST /api/chat` to `DATABRICKS_APP_URL` — the assistant's approve/reject/remediate endpoints are unreachable from this app.

## Deployment (Databricks Apps)

```bash
databricks apps create sentinel-pipeline-frontend -p sentinel-apps
databricks apps deploy sentinel-pipeline-frontend -p sentinel-apps   # app configured with this repo's `static` branch as its git source
```

`app.yaml` builds and starts the app on port 8000 and sets:

```yaml
env:
  - name: "NEXT_PUBLIC_API_URL"
    value: "/api/proxy"
  - name: "DATABRICKS_HOST"
    value: "https://dbc-fa603402-4338.cloud.databricks.com"
  - name: "DATABRICKS_APP_URL"
    value: "https://ai-dataops-assistant-7474652936146529.aws.databricksapps.com"
  - name: "DATABRICKS_CLIENT_ID"
    value: "<service principal application id>"
  - name: "DATABRICKS_CLIENT_SECRET"
    valueFrom: "backend-client-secret"
```

The service principal needs `CAN_USE` on the assistant app (grant it additively with `databricks apps update-permissions`, never `set-permissions`, so the app's existing ACL is preserved). A secret referenced with `valueFrom` must first be attached to the app as a **resource** through the API — a `resources:` block inside `app.yaml` is silently ignored:

```bash
databricks secrets create-scope sentinel-pipeline -p sentinel-apps
databricks secrets put-secret sentinel-pipeline backend-client-secret --string-value '<secret>' -p sentinel-apps
databricks apps update sentinel-pipeline-frontend --json \
  '{"resources":[{"name":"backend-client-secret","secret":{"scope":"sentinel-pipeline","key":"backend-client-secret","permission":"READ"}}]}' \
  -p sentinel-apps
```

## Checks

```bash
npx tsc --noEmit && npx eslint src && npm run build
```
