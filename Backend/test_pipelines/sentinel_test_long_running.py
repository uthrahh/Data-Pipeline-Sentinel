# Databricks notebook source
# Sentinel AI Pipeline — test fixture: runs for ~2 minutes then succeeds.
# Purpose: tests the "RUNNING" status display and non-trivial duration KPIs
# (max/avg run duration, which are otherwise always <1 min).

import time

print("sentinel-test-long-running: starting a ~2 minute simulated workload.")
time.sleep(120)
print("sentinel-test-long-running: completed.")
