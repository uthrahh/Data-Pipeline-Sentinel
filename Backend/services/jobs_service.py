"""Wraps the Databricks Jobs API (client.jobs.*). This is the only source of
truth for pipeline/job/run data in this app — nothing here is mocked, and
nothing here depends on any Delta table existing.
"""

from datetime import datetime, timezone
from typing import Optional

from databricks.sdk.errors import DatabricksError

from databricks_client import client

# Databricks caps list_runs at 26 results per call.
MAX_RUNS_LIMIT = 25


def enum_value(x):
    if x is None:
        return None
    return x.value if hasattr(x, "value") else str(x)


def epoch_ms_to_iso(ms: Optional[int]) -> Optional[str]:
    """0 and None both mean "not set" (e.g. a run still in progress)."""
    if not ms:
        return None
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).isoformat()


def latest_run_status(job_id: int) -> Optional[str]:
    """Best-effort status label for a job: its most recent run's result (or lifecycle state if still running)."""
    try:
        runs = list(client.jobs.list_runs(job_id=job_id, limit=1))
    except DatabricksError:
        return None
    if not runs:
        return "NO_RUNS"
    state = runs[0].state
    if state is None:
        return None
    return enum_value(state.result_state) or enum_value(state.life_cycle_state)


def list_jobs() -> list[dict]:
    jobs = list(client.jobs.list())
    return [
        {
            "job_id": job.job_id,
            "name": job.settings.name if job.settings else None,
            "created_time": epoch_ms_to_iso(job.created_time),
            "creator_user_name": job.creator_user_name,
            "status": latest_run_status(job.job_id),
        }
        for job in jobs
    ]


def get_job(job_id: int) -> dict:
    job = client.jobs.get(job_id)
    return {
        "job_id": job.job_id,
        "name": job.settings.name if job.settings else None,
        "created_time": epoch_ms_to_iso(job.created_time),
        "creator_user_name": job.creator_user_name,
        "run_as_user_name": job.run_as_user_name,
        "status": latest_run_status(job_id),
        "schedule": job.settings.schedule.as_dict() if job.settings and job.settings.schedule else None,
        "tags": job.settings.tags if job.settings else None,
    }


def serialize_run(run) -> dict:
    state = run.state
    result_state = enum_value(state.result_state) if state else None
    lifecycle_state = enum_value(state.life_cycle_state) if state else None
    state_message = (state.state_message or None) if state else None
    duration_ms = run.run_duration or None

    return {
        "run_id": run.run_id,
        "job_id": run.job_id,
        "run_name": run.run_name,
        "lifecycle_state": lifecycle_state,
        "result_state": result_state,
        "state_message": state_message,
        "start_time": epoch_ms_to_iso(run.start_time),
        "end_time": epoch_ms_to_iso(run.end_time),
        "duration_ms": duration_ms,
        "duration_minutes": round(duration_ms / 60000, 1) if duration_ms else None,
        "trigger": enum_value(run.trigger),
        "run_page_url": run.run_page_url,
    }


def list_runs(job_id: int, limit: int = MAX_RUNS_LIMIT, **kwargs) -> list[dict]:
    limit = max(1, min(limit, MAX_RUNS_LIMIT))
    runs = list(client.jobs.list_runs(job_id=job_id, limit=limit, **kwargs))
    return [serialize_run(r) for r in runs]


def get_run_raw(run_id: int):
    """Returns the raw SDK run object (not serialized) — used by incidents_service
    to check a remediation run's live status without re-fetching by job_id."""
    return client.jobs.get_run(run_id)


def get_run_error_detail(run_id: int) -> Optional[str]:
    """Best-effort real error text for a failed run. The top-level run's
    state_message is usually just a generic wrapper (e.g. "Workload failed,
    see run output for details.") — the actual exception message lives in
    each failed task's run output. Used by incidents_service to classify
    failures accurately instead of guessing off the generic wrapper text.
    Returns None (caller falls back to state_message) if nothing more
    specific is found — e.g. an infra-level failure with no task output at all."""
    try:
        run = client.jobs.get_run(run_id)
    except DatabricksError:
        return None

    task_run_ids = [t.run_id for t in run.tasks] if run.tasks else [run_id]
    for task_run_id in task_run_ids:
        try:
            output = client.jobs.get_run_output(task_run_id)
        except DatabricksError:
            continue
        if output.error:
            return output.error
    return None
