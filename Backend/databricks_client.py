import os

from dotenv import load_dotenv
from databricks.sdk import WorkspaceClient
from databricks.sdk.config import Config

load_dotenv()

DATABRICKS_HOST = os.getenv("DATABRICKS_HOST")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")

# Bounds any single Databricks API call. Without this, the SDK's default
# retry budget is ~300s — observed in practice as a single jobs.list_runs()
# call taking 120s+ (the request kept retrying) and blocking /api/pipelines
# for everyone, since jobs_service.list_jobs() calls it once per job. A slow
# or flaky job/run should surface as a quick per-job failure, not hang the
# whole endpoint.
_TIMEOUT_KWARGS = {"http_timeout_seconds": 10, "retry_timeout_seconds": 20}

# When deployed as a Databricks App, host/token are supplied by the app's own
# service-principal identity and DATABRICKS_TOKEN won't be set locally — the
# SDK's default auth chain handles that case on its own. Locally, both must
# be present in .env. (host/token must go through Config, not WorkspaceClient
# kwargs, once a `config=` object is also being passed — WorkspaceClient
# ignores its own host/token/etc. kwargs whenever `config` is set.)
if DATABRICKS_TOKEN:
    client = WorkspaceClient(config=Config(host=DATABRICKS_HOST, token=DATABRICKS_TOKEN, **_TIMEOUT_KWARGS))
else:
    client = WorkspaceClient(config=Config(**_TIMEOUT_KWARGS))
