"""Incident detection + lifecycle, backed by a real Delta table this app owns.

There is no LLM-based investigation/DQ/SLA agent here by design (this is the
"minimal, purpose-built" backend, not a rebuild of the old multi-agent
system). An "incident" is simply: a real Databricks job run that failed.
"Remediation" is the one generic, safe action that applies to any job without
pipeline-specific business logic: re-run it via the Jobs API. Everything else
(error_type, severity) is a transparent, documented keyword/frequency
heuristic over real data — never an invented narrative.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from services.jobs_service import list_jobs, list_runs, get_run_raw, enum_value
from services.sql_service import execute_sql, escape_sql

CATALOG = "sentinel_pipeline"  # owned by this app's setup, not shared with the old project
SCHEMA = "ops"
TABLE = f"{CATALOG}.{SCHEMA}.incidents"

# Run outcomes that count as a failure worth raising an incident for.
# CANCELED/CANCELLED deliberately excluded — usually a deliberate user action, not a failure.
FAILURE_RESULT_STATES = {"FAILED", "TIMEDOUT", "INTERNAL_ERROR", "UPSTREAM_FAILED"}

ACTIVE_STATUSES = ["WAITING_APPROVAL", "REMEDIATING", "REMEDIATION_FAILED"]

_COLUMNS = [
    "incident_id", "job_id", "job_name", "run_id", "run_page_url", "error_message",
    "error_type", "result_state", "severity", "detected_at", "status",
    "approved_by", "approved_at", "rejection_reason", "remediation_run_id",
    "remediation_status", "remediation_started_at", "remediation_completed_at", "updated_at",
    "suggested_action", "suggested_action_reason",
]


def ensure_schema() -> None:
    execute_sql(f"CREATE SCHEMA IF NOT EXISTS {CATALOG}.{SCHEMA}")
    execute_sql(f"""
        CREATE TABLE IF NOT EXISTS {TABLE} (
            incident_id STRING,
            job_id BIGINT,
            job_name STRING,
            run_id BIGINT,
            run_page_url STRING,
            error_message STRING,
            error_type STRING,
            result_state STRING,
            severity STRING,
            detected_at TIMESTAMP,
            status STRING,
            approved_by STRING,
            approved_at TIMESTAMP,
            rejection_reason STRING,
            remediation_run_id BIGINT,
            remediation_status STRING,
            remediation_started_at TIMESTAMP,
            remediation_completed_at TIMESTAMP,
            updated_at TIMESTAMP,
            suggested_action STRING,
            suggested_action_reason STRING
        ) USING DELTA
    """)
    # Table already existed before suggested_action/suggested_action_reason were
    # added — backfill the columns on deployments that created it earlier.
    # Swallowed because a fresh table (created just above, already with these
    # columns) makes this a harmless no-op error ("column already exists").
    try:
        execute_sql(f"ALTER TABLE {TABLE} ADD COLUMNS (suggested_action STRING, suggested_action_reason STRING)")
    except Exception:
        pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sql_ts(iso: Optional[str]) -> str:
    """ISO 8601 -> Databricks SQL TIMESTAMP literal body ('2026-09-11 08:01:41.5')."""
    s = iso or _now_iso()
    s = s.replace("T", " ")
    for suffix in ("+00:00", "Z"):
        if s.endswith(suffix):
            s = s[: -len(suffix)]
    return s


def _classify_error_type(message: Optional[str]) -> str:
    """Plain keyword heuristic over the real Databricks error text — not an
    inferred/AI classification. Kept simple and visible on purpose."""
    m = (message or "").lower()
    if "permission" in m or "access" in m or "denied" in m or "does not exist" in m:
        return "UserError"
    if (
        "cluster" in m or "timeout" in m or "memory" in m or "internal_error" in m
        or "connection" in m or "flaky" in m or "transient" in m or "unavailable" in m
    ):
        return "InfrastructureError"
    if "schema" in m or "column" in m or "null" in m or "duplicate" in m:
        return "DataError"
    return "SystemError"


# --- Suggested remediation --------------------------------------------------
#
# A plain, transparent rule mapping error_type -> suggested action, same spirit
# as _classify_error_type above: no LLM, no invented confidence score. RETRY
# means "safe enough to auto-remediate without waiting on a human"; ESCALATE
# means "leave it at WAITING_APPROVAL, a human decides".

ERROR_TYPE_ACTION = {
    "InfrastructureError": "RETRY",
    "UserError": "ESCALATE",
    "DataError": "ESCALATE",
    "SystemError": "ESCALATE",
}

ERROR_TYPE_REASON = {
    "InfrastructureError": "Looks transient (cluster/timeout/memory/connection) — retrying the same job usually resolves it.",
    "UserError": "Looks like a permissions or config problem — a rerun won't fix it, needs a human to check access/config.",
    "DataError": "Looks like a data quality problem (schema/null/duplicate) — needs a human to review the upstream data before rerunning.",
    "SystemError": "Unrecognized failure pattern — needs a human to look at the run before deciding.",
}

# Consecutive auto-remediation failures on the same job before Sentinel stops
# retrying automatically and falls back to human approval. Prevents a job
# that's permanently broken (not actually transient) from being re-run forever.
MAX_AUTO_RETRIES = 3
AUTO_REMEDIATION_ACTOR = "auto-remediation"


def _recent_auto_failure_streak(job_id: int) -> int:
    """Counts this job's most recent auto-remediation attempts, most recent
    first, stopping at the first one that wasn't a failure. A human approval
    (or a successful auto-remediation) resets the streak back to 0."""
    rows = execute_sql(f"""
        SELECT status FROM {TABLE}
        WHERE job_id = {int(job_id)} AND approved_by = '{AUTO_REMEDIATION_ACTOR}'
        ORDER BY detected_at DESC LIMIT {MAX_AUTO_RETRIES}
    """)
    streak = 0
    for row in rows:
        if row["status"] != "REMEDIATION_FAILED":
            break
        streak += 1
    return streak


def _suggest_action(job_id: int, error_type: str, severity: str) -> tuple[str, str]:
    """Returns (action, reason) for a newly-detected failure. HIGH severity
    (a job already failing repeatedly in the lookback window) always escalates
    regardless of error type — a job unstable enough to be HIGH should get
    human eyes, not another blind retry."""
    if severity == "HIGH":
        return "ESCALATE", "This job has failed more than once recently — escalating for human review instead of retrying automatically."

    action = ERROR_TYPE_ACTION.get(error_type, "ESCALATE")
    if action != "RETRY":
        return action, ERROR_TYPE_REASON.get(error_type, ERROR_TYPE_REASON["SystemError"])

    if _recent_auto_failure_streak(job_id) >= MAX_AUTO_RETRIES:
        return "ESCALATE", f"Auto-remediation has failed {MAX_AUTO_RETRIES} times in a row on this job — pausing automatic retries, needs a human to investigate."

    return "RETRY", ERROR_TYPE_REASON["InfrastructureError"]


def _row_to_dict(row: dict) -> dict:
    return {k: row.get(k) for k in _COLUMNS}


def _existing_keys() -> set[tuple[int, int]]:
    rows = execute_sql(f"SELECT job_id, run_id FROM {TABLE}")
    return {(int(r["job_id"]), int(r["run_id"])) for r in rows}


def sync_incidents(lookback_days: int = 3) -> int:
    """Scans recent runs of every real job for failures not already recorded,
    and inserts a WAITING_APPROVAL incident for each. Idempotent — safe to
    call on every read. Returns the number of newly created incidents."""
    ensure_schema()
    existing = _existing_keys()
    window_start_ms = int((datetime.now(timezone.utc).timestamp() - lookback_days * 86400) * 1000)

    job_failure_counts: dict[int, int] = {}
    new_count = 0

    for job in list_jobs():
        try:
            runs = list_runs(job["job_id"], start_time_from=window_start_ms, completed_only=True)
        except Exception:
            continue

        for run in runs:
            if run["result_state"] not in FAILURE_RESULT_STATES:
                continue

            job_failure_counts[job["job_id"]] = job_failure_counts.get(job["job_id"], 0) + 1
            key = (job["job_id"], run["run_id"])
            if key in existing:
                continue

            incident_id = f"INC-{uuid.uuid4().hex[:10].upper()}"
            # Recurring failure on the same job within the lookback window -> HIGH, else MEDIUM.
            severity = "HIGH" if job_failure_counts[job["job_id"]] > 1 else "MEDIUM"
            error_type = _classify_error_type(run["state_message"])
            action, reason = _suggest_action(job["job_id"], error_type, severity)
            now = _now_iso()

            execute_sql(f"""
                INSERT INTO {TABLE} (
                    incident_id, job_id, job_name, run_id, run_page_url, error_message,
                    error_type, result_state, severity, detected_at, status, updated_at,
                    suggested_action, suggested_action_reason
                ) VALUES (
                    '{incident_id}', {job['job_id']}, '{escape_sql(job['name'] or '')}', {run['run_id']},
                    '{escape_sql(run['run_page_url'] or '')}', '{escape_sql(run['state_message'] or 'No error message reported.')}',
                    '{error_type}', '{run['result_state']}', '{severity}',
                    TIMESTAMP '{_sql_ts(run['start_time'])}', 'WAITING_APPROVAL', TIMESTAMP '{_sql_ts(now)}',
                    '{action}', '{escape_sql(reason)}'
                )
            """)
            existing.add(key)
            new_count += 1

            if action == "RETRY":
                # Auto-eligible: don't wait on a human. Best-effort — if the
                # trigger itself fails (e.g. Jobs API hiccup), the incident is
                # simply left at WAITING_APPROVAL for a human to pick up.
                try:
                    _trigger_remediation(incident_id, job["job_id"], AUTO_REMEDIATION_ACTOR)
                except Exception:
                    pass

    return new_count


def _fetch_row(incident_id: str) -> Optional[dict]:
    rows = execute_sql(f"SELECT * FROM {TABLE} WHERE incident_id = '{escape_sql(incident_id)}' LIMIT 1")
    return _row_to_dict(rows[0]) if rows else None


def _refresh_if_remediating(row: dict) -> dict:
    """If this incident is mid-remediation, check the real rerun's live state
    and resolve/fail it accordingly. Called on every read (not just the active
    list) so status is always current without needing a background worker."""
    if row["status"] != "REMEDIATING" or not row.get("remediation_run_id"):
        return row

    try:
        run = get_run_raw(int(row["remediation_run_id"]))
    except Exception:
        return row

    result_state = enum_value(run.state.result_state) if run.state else None
    if result_state is None:
        return row  # still running

    now = _now_iso()
    if result_state == "SUCCESS":
        execute_sql(f"""
            UPDATE {TABLE}
            SET status = 'RESOLVED', remediation_status = 'SUCCESS',
                remediation_completed_at = TIMESTAMP '{_sql_ts(now)}', updated_at = TIMESTAMP '{_sql_ts(now)}'
            WHERE incident_id = '{escape_sql(row["incident_id"])}'
        """)
    elif result_state in FAILURE_RESULT_STATES:
        execute_sql(f"""
            UPDATE {TABLE}
            SET status = 'REMEDIATION_FAILED', remediation_status = 'FAILED',
                remediation_completed_at = TIMESTAMP '{_sql_ts(now)}', updated_at = TIMESTAMP '{_sql_ts(now)}'
            WHERE incident_id = '{escape_sql(row["incident_id"])}'
        """)
    else:
        return row

    return _fetch_row(row["incident_id"]) or row


def get_active_incidents() -> list[dict]:
    sync_incidents()
    statuses = ", ".join(f"'{s}'" for s in ACTIVE_STATUSES)
    rows = execute_sql(f"SELECT * FROM {TABLE} WHERE status IN ({statuses}) ORDER BY detected_at DESC")
    return [_refresh_if_remediating(_row_to_dict(r)) for r in rows]


def get_incident_history(limit: int = 50) -> list[dict]:
    rows = execute_sql(f"SELECT * FROM {TABLE} ORDER BY updated_at DESC LIMIT {int(limit)}")
    return [_refresh_if_remediating(_row_to_dict(r)) for r in rows]


def get_incident(incident_id: str) -> Optional[dict]:
    row = _fetch_row(incident_id)
    if not row:
        return None
    return _refresh_if_remediating(row)


def get_incident_by_run_id(run_id: int) -> Optional[dict]:
    rows = execute_sql(f"SELECT * FROM {TABLE} WHERE run_id = {int(run_id)} ORDER BY detected_at DESC LIMIT 1")
    if not rows:
        return None
    return _refresh_if_remediating(_row_to_dict(rows[0]))


# The sentinel-test-transient-failure test job fails by default and only
# succeeds when rerun with force_success=true — this is what makes it useful
# for testing the full happy-path lifecycle end to end. This is the one
# legitimate case for job-specific remediation logic in an otherwise fully
# generic "just rerun it" action; every other job gets a plain rerun.
TRANSIENT_TEST_JOB_ID = 750109753957669


def _trigger_remediation(incident_id: str, job_id: int, actor: str) -> None:
    """Shared by both human approval and auto-remediation: fire the real
    rerun and mark the incident REMEDIATING. `actor` is recorded as
    `approved_by` — either a human's name or AUTO_REMEDIATION_ACTOR — so the
    audit trail always shows who/what authorized the run."""
    from databricks_client import client  # local import avoids a module cycle at import time

    run_params = {"notebook_params": {"force_success": "true"}} if job_id == TRANSIENT_TEST_JOB_ID else {}
    run_response = client.jobs.run_now(job_id=job_id, **run_params)
    remediation_run_id = run_response.run_id
    now = _now_iso()

    execute_sql(f"""
        UPDATE {TABLE}
        SET status = 'REMEDIATING', approved_by = '{escape_sql(actor)}',
            approved_at = TIMESTAMP '{_sql_ts(now)}', remediation_run_id = {remediation_run_id},
            remediation_status = 'RUNNING', remediation_started_at = TIMESTAMP '{_sql_ts(now)}',
            updated_at = TIMESTAMP '{_sql_ts(now)}'
        WHERE incident_id = '{escape_sql(incident_id)}'
    """)


def approve_incident(incident_id: str, approved_by: str) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        raise ValueError(f"Incident {incident_id} not found")
    if incident["status"] != "WAITING_APPROVAL":
        raise ValueError(f"Incident {incident_id} is not awaiting approval (status={incident['status']})")

    _trigger_remediation(incident_id, int(incident["job_id"]), approved_by)
    return get_incident(incident_id)


def reject_incident(incident_id: str, rejected_by: str, reason: str) -> dict:
    incident = get_incident(incident_id)
    if not incident:
        raise ValueError(f"Incident {incident_id} not found")
    if incident["status"] != "WAITING_APPROVAL":
        raise ValueError(f"Incident {incident_id} is not awaiting approval (status={incident['status']})")

    now = _now_iso()
    execute_sql(f"""
        UPDATE {TABLE}
        SET status = 'REJECTED', approved_by = '{escape_sql(rejected_by)}',
            approved_at = TIMESTAMP '{_sql_ts(now)}', rejection_reason = '{escape_sql(reason)}',
            updated_at = TIMESTAMP '{_sql_ts(now)}'
        WHERE incident_id = '{escape_sql(incident_id)}'
    """)
    return get_incident(incident_id)
