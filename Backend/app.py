"""
Sentinel Pipeline Backend — minimal, purpose-built API for the Sentinel AI
Pipeline frontend. Every response is backed by real Databricks data: the
Jobs API for pipelines/runs, and one small Delta table this app owns for
incident workflow state (approve/reject/remediate can't come from Databricks
directly — that's application state, not something Databricks tracks).

No LLM agents, no chat, no fabricated investigation/DQ/SLA narrative. See
services/incidents_service.py for exactly what "incident" and "remediation"
mean here.
"""

import os

from dotenv import load_dotenv

load_dotenv()

_REQUIRED_ENV = ["DATABRICKS_HOST", "DATABRICKS_WAREHOUSE_ID"]
_missing = [name for name in _REQUIRED_ENV if not os.getenv(name)]
if _missing:
    raise RuntimeError(
        f"Missing required environment variable(s): {', '.join(_missing)}. "
        "Configure them in .env (local) or the Databricks App's environment (deployed)."
    )

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from databricks.sdk.errors import DatabricksError

from databricks_client import client
from services import jobs_service, incidents_service
from services.sql_service import execute_sql

app = FastAPI(title="Sentinel Pipeline Backend", version="1.0.0")

# Frontend origins allowed to call this API. Add the deployed Vercel URL here
# once it exists — never widen this to "*".
ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Creates the incidents schema/table if they don't exist yet. Safe to run
    # every startup — CREATE ... IF NOT EXISTS is a no-op once they're there.
    try:
        incidents_service.ensure_schema()
    except Exception as e:
        # Don't crash the whole app if the warehouse is briefly unreachable at
        # boot — individual incident endpoints will surface the real error.
        print(f"Warning: could not ensure incidents schema at startup: {e}")


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():
    try:
        client.current_user.me()
        databricks_status = "connected"
    except Exception:
        databricks_status = "unavailable"

    return {
        "success": True,
        "service": "Sentinel Pipeline Backend",
        "status": "ok" if databricks_status == "connected" else "degraded",
        "databricks": databricks_status,
    }


@app.get("/api/sql-warehouse/health")
def sql_warehouse_health():
    try:
        rows = execute_sql("SELECT 1 AS ok")
        return {"success": True, "status": "connected", "result": rows}
    except Exception as e:
        return {"success": False, "status": "unavailable", "error": str(e)}


# ============================================================
# PIPELINES (Databricks Jobs API)
# ============================================================

@app.get("/api/pipelines")
def list_pipelines():
    try:
        jobs = jobs_service.list_jobs()
    except DatabricksError as e:
        raise HTTPException(status_code=502, detail=f"Databricks Jobs API error: {e}")
    return {"success": True, "data": {"pipelines": jobs, "count": len(jobs)}}


@app.get("/api/pipelines/overview")
def pipelines_overview():
    try:
        jobs = jobs_service.list_jobs()
    except DatabricksError as e:
        raise HTTPException(status_code=502, detail=f"Databricks Jobs API error: {e}")

    from datetime import datetime, timezone

    window_days = int(os.getenv("OVERVIEW_WINDOW_DAYS", "7"))
    window_start_ms = int((datetime.now(timezone.utc).timestamp() - window_days * 86400) * 1000)

    total_runs = completed_runs = failed_runs = 0
    durations_ms: list[float] = []

    for job in jobs:
        try:
            runs = jobs_service.list_runs(job["job_id"], start_time_from=window_start_ms, completed_only=False)
        except DatabricksError:
            continue
        for run in runs:
            total_runs += 1
            if run["result_state"] is None:
                continue
            completed_runs += 1
            if run["result_state"] in incidents_service.FAILURE_RESULT_STATES:
                failed_runs += 1
            if run["duration_ms"]:
                durations_ms.append(run["duration_ms"])

    success_rate = round(((completed_runs - failed_runs) / completed_runs) * 100, 1) if completed_runs else None
    max_duration = round(max(durations_ms) / 60000, 1) if durations_ms else None
    avg_duration = round((sum(durations_ms) / len(durations_ms)) / 60000, 1) if durations_ms else None

    return {
        "success": True,
        "data": {
            "window_days": window_days,
            "total_pipeline_executions": total_runs,
            "total_pipelines_failed": failed_runs,
            "pipeline_success_rate_pct": success_rate,
            "max_pipeline_run_duration_minutes": max_duration,
            "avg_pipeline_run_duration_minutes": avg_duration,
        },
    }


@app.get("/api/pipelines/{job_id}")
def pipeline_detail(job_id: int):
    try:
        return {"success": True, "data": jobs_service.get_job(job_id)}
    except DatabricksError as e:
        if "does not exist" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        raise HTTPException(status_code=502, detail=f"Databricks Jobs API error: {e}")


@app.get("/api/pipelines/{job_id}/runs")
def pipeline_runs(job_id: int, limit: int = jobs_service.MAX_RUNS_LIMIT):
    try:
        client.jobs.get(job_id)  # confirms it exists -> clean 404 instead of an empty list
        runs = jobs_service.list_runs(job_id, limit=limit)
    except DatabricksError as e:
        if "does not exist" in str(e).lower():
            raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
        raise HTTPException(status_code=502, detail=f"Databricks Jobs API error: {e}")
    return {"success": True, "data": {"runs": runs, "count": len(runs)}}


# ============================================================
# INCIDENTS (this app's own Delta table + real remediation reruns)
# ============================================================

@app.get("/api/incidents/active")
def active_incidents():
    try:
        return {"success": True, "data": {"incidents": (rows := incidents_service.get_active_incidents()), "count": len(rows)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to load active incidents: {e}")


@app.get("/api/incidents/history")
def incident_history():
    try:
        rows = incidents_service.get_incident_history()
        return {"success": True, "data": {"incidents": rows, "count": len(rows)}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to load incident history: {e}")


@app.get("/api/incidents/by-run/{run_id}")
def incident_by_run(run_id: int):
    try:
        incident = incidents_service.get_incident_by_run_id(run_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to load incident: {e}")
    if not incident:
        raise HTTPException(status_code=404, detail="No incident for this run")
    return {"success": True, "data": incident}


@app.get("/api/incidents/{incident_id}")
def incident_detail(incident_id: str):
    try:
        incident = incidents_service.get_incident(incident_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to load incident: {e}")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"success": True, "data": incident}


class ApprovalRequest(BaseModel):
    approved_by: str = "Sentinel User"


class RejectRequest(BaseModel):
    rejected_by: str = "Sentinel User"
    reason: str = "No reason provided."


@app.post("/api/incidents/{incident_id}/approve")
def approve_incident_api(incident_id: str, request: ApprovalRequest):
    try:
        result = incidents_service.approve_incident(incident_id, request.approved_by)
        return {"success": True, "action": "APPROVE", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to approve incident: {e}")


@app.post("/api/incidents/{incident_id}/reject")
def reject_incident_api(incident_id: str, request: RejectRequest):
    try:
        result = incidents_service.reject_incident(incident_id, request.rejected_by, request.reason)
        return {"success": True, "action": "REJECT", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unable to reject incident: {e}")
