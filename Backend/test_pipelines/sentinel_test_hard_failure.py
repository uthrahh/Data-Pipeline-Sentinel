# Databricks notebook source
# Sentinel AI Pipeline — test fixture: always fails, including on rerun.
# Purpose: tests incident detection, the Reject path, and the "remediation
# also failed -> Needs Manual Review" path (since a re-run of this job fails
# again by design, it never auto-resolves).

raise Exception(
    "sentinel-test-hard-failure: deliberate, permanent failure. "
    "This job is designed to never succeed, even when remediated — "
    "used to test the escalation/manual-review path, not the happy path."
)
