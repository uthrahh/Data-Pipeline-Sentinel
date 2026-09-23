# Databricks notebook source
# Sentinel AI Pipeline — test fixture: fails on its normal (scheduled) runs,
# succeeds when the backend's remediation reruns it with force_success=true.
# Purpose: the flagship end-to-end test — detect a real failure, approve it,
# watch a real Databricks rerun succeed, watch the incident auto-resolve.
# See Backend/services/incidents_service.py::approve_incident, which passes
# notebook_params={"force_success": "true"} specifically for this job.

dbutils.widgets.text("force_success", "false")
force_success = dbutils.widgets.get("force_success")

if force_success != "true":
    raise Exception(
        "sentinel-test-transient-failure: simulated transient failure "
        "(e.g. a flaky upstream connection). Approve remediation on the "
        "resulting incident to retry with force_success=true."
    )

print("sentinel-test-transient-failure: retried with force_success=true — succeeded.")
