# Sentinel Pipeline Backend

Minimal, purpose-built FastAPI backend for the Sentinel AI Pipeline frontend
(`../Frontend`). Every response is backed by real Databricks data — no
mocks, no LLM agents, no fabricated narrative.

## What this is (and isn't)

- **Pipelines/runs/overview** come directly from the Databricks Jobs API
  (`client.jobs.*`) — always live, no dependency on any Delta table.
- **Incidents** are real failed job runs, tracked in one Delta table this app
  owns (`sentinel_pipeline.ops.incidents`), because
  approve/reject/remediation state is application state Databricks doesn't
  track natively. "Remediation" is the one generic, safe action that applies
  to any job: re-run it via the Jobs API. See `services/incidents_service.py`
  for the exact (documented, transparent) heuristics used for severity and
  error classification — there is no LLM investigation/DQ/SLA agent here.
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
`sentinel` schema and `incidents` table if they don't exist yet
(`CREATE ... IF NOT EXISTS` — safe to run repeatedly).

## Deploying as a Databricks App

This is the preferred hosting target — no separate server to manage, and
`DATABRICKS_HOST`/auth come from the app's own service-principal identity
automatically (don't set `DATABRICKS_TOKEN` for this path).

```bash
# One-time: install and authenticate the CLI
pip install databricks-cli --upgrade
databricks auth login --host https://dbc-fa603402-4338.cloud.databricks.com

# From this directory:
databricks apps create sentinel-pipeline-backend
databricks apps deploy sentinel-pipeline-backend --source-code-path .
```

After deploying, the app's URL (shown in the Databricks Apps UI, or via
`databricks apps get sentinel-pipeline-backend`) becomes the frontend's
`NEXT_PUBLIC_API_URL`. Add that URL to `ALLOWED_ORIGINS`... actually — add the
**frontend's** deployed URL (e.g. your Vercel domain) to `app.py`'s
`ALLOWED_ORIGINS` list before deploying, or CORS will block it.

## Frontend wiring

In `Frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000        # or the deployed Databricks App URL
NEXT_PUBLIC_USE_LIVE_API=true
```

## Endpoints

| Method | Path | Source |
|---|---|---|
| GET | `/api/health` | Databricks auth check |
| GET | `/api/sql-warehouse/health` | Fixed `SELECT 1` — never accepts caller SQL |
| GET | `/api/pipelines` | Jobs API |
| GET | `/api/pipelines/{job_id}` | Jobs API |
| GET | `/api/pipelines/{job_id}/runs` | Jobs API |
| GET | `/api/pipelines/overview` | Jobs API, aggregated |
| GET | `/api/incidents/active` | `sentinel.incidents` (syncs from Jobs API first) |
| GET | `/api/incidents/history` | `sentinel.incidents` |
| GET | `/api/incidents/{incident_id}` | `sentinel.incidents` |
| GET | `/api/incidents/by-run/{run_id}` | `sentinel.incidents` |
| POST | `/api/incidents/{incident_id}/approve` | Triggers a real `jobs.run_now` rerun |
| POST | `/api/incidents/{incident_id}/reject` | Marks rejected, no execution |

## Security

- `DATABRICKS_TOKEN` is never logged, printed, or returned by any endpoint.
- The only SQL execution path (`services/sql_service.py::execute_sql`) never
  accepts caller-supplied SQL — every call site is a hardcoded/parameterized
  query string.
- CORS is restricted to `ALLOWED_ORIGINS` in `app.py` — never widen to `*`.
