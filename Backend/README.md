# Sentinel Pipeline Backend

Minimal, purpose-built FastAPI backend for the Sentinel AI Pipeline frontend
(`../Frontend`). Every response is backed by real Databricks data — no
mocks, no LLM agents, no fabricated narrative.

**Live**: `https://sentinel-pipeline-backend-7474652936146529.aws.databricksapps.com`
(runs as a Databricks App — see below)

## What this is (and isn't)

- **Pipelines/runs/overview** come directly from the Databricks Jobs API
  (`client.jobs.*`) — always live, no dependency on any Delta table.
- **Incidents** are real failed job runs, tracked in one Delta table this app
  owns: **`sentinel_pipeline.ops.incidents`** (catalog `sentinel_pipeline`,
  schema `ops`) — a catalog created specifically for this project so
  permissions are self-contained; it's not shared with any other project.
  Incident tracking exists as a table because approve/reject/remediation
  state is *application* state — Databricks doesn't track "did a human
  approve this fix" natively. "Remediation" is the one generic, safe action
  that applies to any job without pipeline-specific logic: re-run it via the
  Jobs API. See `services/incidents_service.py` for the exact (documented,
  transparent) heuristics used for severity and error classification —
  there is no LLM investigation/DQ/SLA agent here.
- There is **no chat assistant** in this backend. If you need that, it's a
  separate, larger effort (Genie space + model serving endpoint) — ask for it
  explicitly.

## Local development

```bash
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env
# edit .env: fill in DATABRICKS_TOKEN (and DATABRICKS_HOST/WAREHOUSE_ID if different)
.venv\Scripts\python.exe -m uvicorn app:app --reload --port 8000
```

Verify:
```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/api/pipelines
curl http://localhost:8000/api/incidents/active
```

The first request to `/api/incidents/*` (and app startup) creates the
`sentinel_pipeline.ops` schema and `incidents` table if they don't exist yet
(`CREATE ... IF NOT EXISTS` — safe to run repeatedly).

## Deploying as a Databricks App

This is how it's actually hosted — no separate server to manage, and
`DATABRICKS_HOST`/auth come from the app's own service-principal identity
automatically at runtime (don't set `DATABRICKS_TOKEN` for this path).

```bash
# One-time: install the CLI (see https://github.com/databricks/cli/releases
# for the latest Windows build) and authenticate
databricks auth login --host https://dbc-fa603402-4338.cloud.databricks.com --profile sentinel-apps

# One-time: create the app
databricks apps create sentinel-pipeline-backend -p sentinel-apps

# Every deploy: sync source to a workspace path, then deploy from there.
# (`--source-code-path .` pointing at a *local* path does NOT work — Databricks
# Apps deploy from a workspace path, not your machine, so sync first.)
databricks sync . "/Workspace/Users/<you>/sentinel-pipeline-backend" \
  --exclude ".venv/**" --exclude "__pycache__/**" --exclude ".env" --full -p sentinel-apps

databricks apps deploy sentinel-pipeline-backend \
  --source-code-path "/Workspace/Users/<you>/sentinel-pipeline-backend" -p sentinel-apps
```

Check logs any time with `databricks apps logs sentinel-pipeline-backend -p sentinel-apps`.

### Permissions the deployed app's service principal needs

The deployed app runs as its **own identity** (a service principal named
`app-<id> sentinel-pipeline-backend`), completely separate from whichever
user deploys it. That identity needs to be granted, once:

```sql
GRANT USE CATALOG ON CATALOG sentinel_pipeline TO `<app-service-principal-id>`;
GRANT USE SCHEMA ON SCHEMA sentinel_pipeline.ops TO `<app-service-principal-id>`;
GRANT CREATE TABLE ON SCHEMA sentinel_pipeline.ops TO `<app-service-principal-id>`;
GRANT SELECT ON SCHEMA sentinel_pipeline.ops TO `<app-service-principal-id>`;
GRANT MODIFY ON SCHEMA sentinel_pipeline.ops TO `<app-service-principal-id>`;
```
```bash
# Jobs API access (list, view runs, trigger reruns) per job:
databricks jobs update-permissions <job_id> \
  --json '{"access_control_list":[{"service_principal_name":"<app-service-principal-id>","permission_level":"CAN_MANAGE_RUN"}]}'
```

Without these, `/api/pipelines` returns an empty list and `/api/incidents/*`
fails with a Unity Catalog permission error — both fail silently from the
frontend's point of view (it just shows empty/error states), so if the
deployed app looks broken after a fresh `apps create`, this is the first
thing to check.

## Frontend wiring

The frontend doesn't call this backend directly when deployed (see
`../Frontend/README.md` — Databricks Apps require an authenticated caller,
so only a server-side proxy can reach this URL, never a browser directly).
For local dev, `Frontend/.env.local` points straight at
`http://localhost:8000`, which has no such restriction.

## Endpoints

| Method | Path | Source |
|---|---|---|
| GET | `/api/health` | Databricks auth check |
| GET | `/api/sql-warehouse/health` | Fixed `SELECT 1` — never accepts caller SQL |
| GET | `/api/pipelines` | Jobs API |
| GET | `/api/pipelines/{job_id}` | Jobs API |
| GET | `/api/pipelines/{job_id}/runs` | Jobs API (capped at 25/call — Databricks' own limit) |
| GET | `/api/pipelines/overview` | Jobs API, aggregated (KPIs over a trailing window, default 7 days) |
| GET | `/api/incidents/active` | `sentinel_pipeline.ops.incidents` (syncs from Jobs API first) |
| GET | `/api/incidents/history` | `sentinel_pipeline.ops.incidents` |
| GET | `/api/incidents/{incident_id}` | `sentinel_pipeline.ops.incidents` |
| GET | `/api/incidents/by-run/{run_id}` | `sentinel_pipeline.ops.incidents` |
| POST | `/api/incidents/{incident_id}/approve` | Triggers a real `jobs.run_now` rerun |
| POST | `/api/incidents/{incident_id}/reject` | Marks rejected, no execution |

## Security

- `DATABRICKS_TOKEN` (local dev) / the app's OAuth credential (deployed) is
  never logged, printed, or returned by any endpoint.
- The only SQL execution path (`services/sql_service.py::execute_sql`) never
  accepts caller-supplied SQL — every call site is a hardcoded/parameterized
  query string.
- When deployed as a Databricks App, this backend is protected by
  Databricks' own SSO gate — every request (including API calls) must come
  from an authenticated caller with `CAN_USE` on the app. There is no
  anonymous access. `ALLOWED_ORIGINS` in `app.py` is a secondary, local-dev
  CORS allowlist and isn't what protects the deployed app.
