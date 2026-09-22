import os

from dotenv import load_dotenv
from databricks.sdk import WorkspaceClient

load_dotenv()

DATABRICKS_HOST = os.getenv("DATABRICKS_HOST")
DATABRICKS_TOKEN = os.getenv("DATABRICKS_TOKEN")

# When deployed as a Databricks App, host/token are supplied by the app's own
# service-principal identity and DATABRICKS_TOKEN won't be set locally — the
# SDK's default auth chain handles that case on its own. Locally, both must
# be present in .env.
if DATABRICKS_TOKEN:
    client = WorkspaceClient(host=DATABRICKS_HOST, token=DATABRICKS_TOKEN)
else:
    client = WorkspaceClient()
