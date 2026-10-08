# Sentinel AI Pipeline — Frontend (`static`)

Static demo of the SAP pipeline operations console, hosted as a **Databricks App**. All pages render deterministic demo data; **Genie** (the chat assistant) is the only live integration.

See the [root README](../README.md) for what each page does. This file covers the code layout and deployment.

## Data model (`src/ops`)

| File | Purpose |
|---|---|
| `catalog.ts` | 15 pipelines (3 families × 5 countries: CA, DE, GB, SG, US), owners, workspaces (All / Procurement DE / Sales DE), the 15-day window (notifications cover the last 7), the 15-minute SLA baseline |
| `failureTypes.ts` | The 14 failure types (`autoRun: true` for transient/temporary — rerun automatically, no approval): recommendation, remediation, root cause, investigation steps, remediation/validation steps, planned change (e.g. compute 2 → 4 workers), solution text, regression-test definition |
| `data.ts` | Deterministic generator for the 15 days ending **today** (the viewer's current UTC date): 40 runs a day, an incident for every failed run (18 today, covering all 14 types), 12 carried-over open incidents so 24 are active, and the emails sent in the window (the Notifications page shows the last 7 days) — each with a matching audit event |
| `store.ts` | In-memory store (`useSyncExternalStore`): builds the dataset on the client, workspace selection, **approve and remediate** (simulated Databricks run that resolves, or fails and escalates automatically), **reject**, **send email / escalate** |
| `email.ts` | Builds each email from the incident — reason plus the solution for its failure type |
| `validation.ts` | The 7 tables and the 10 data quality checks; running a check returns a random, threshold-consistent result |

The data is built in the browser (the server renders a loading skeleton, `ready: false`), so "today" and the 15-day window always follow the viewer's current date. A fixed PRNG keeps the data stable for a given date.

## Genie (the live part)

`src/services/chatService.ts` POSTs `{ "message": … }` to `${NEXT_PUBLIC_API_URL}/api/chat` and renders `data.message`. Errors degrade to a friendly message.

- **Local:** either `NEXT_PUBLIC_API_URL=http://localhost:8000` (any server implementing that endpoint), or run through the proxy with `NEXT_PUBLIC_API_URL=/api/proxy`, `DATABRICKS_APP_URL=<assistant url>` and `DATABRICKS_TOKEN=<your token>`.
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
