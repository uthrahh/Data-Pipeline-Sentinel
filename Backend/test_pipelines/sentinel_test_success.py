# Databricks notebook source
# Sentinel AI Pipeline — test fixture: always succeeds.
# Purpose: keeps the Pipelines/Overview/Analytics pages populated with fresh,
# real (not fabricated) execution data. Never raises, never creates an incident.

print("sentinel-test-success: running a trivial, always-succeeding task.")
print("This exercises: healthy-pipeline monitoring, success-rate KPIs, recent-executions list.")
