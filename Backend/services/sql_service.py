import os
import time

from databricks.sdk.service.sql import StatementState

from databricks_client import client


def execute_sql(query: str, timeout_seconds: int = 60) -> list[dict]:
    """Run a fixed SQL statement against the configured warehouse and return rows as dicts.

    Never pass caller-supplied SQL through this function from an HTTP request —
    every call site in this app uses a hardcoded query string or parameterizes
    via escape_sql(), never raw user input.
    """
    warehouse_id = os.environ["DATABRICKS_WAREHOUSE_ID"]

    response = client.statement_execution.execute_statement(
        warehouse_id=warehouse_id,
        statement=query,
        wait_timeout="0s",
    )
    statement_id = response.statement_id
    start_time = time.time()

    while True:
        response = client.statement_execution.get_statement(statement_id)
        state = response.status.state

        if state == StatementState.SUCCEEDED:
            break
        if state in (StatementState.FAILED, StatementState.CANCELED, StatementState.CLOSED):
            error_message = str(response.status.error) if response.status.error else ""
            raise RuntimeError(f"SQL execution failed. State: {state}. Error: {error_message}")
        if time.time() - start_time > timeout_seconds:
            raise RuntimeError(f"SQL execution timed out after {timeout_seconds}s. Last state: {state}")

        time.sleep(1)

    if response.result is None or response.result.data_array is None:
        return []

    columns = []
    if response.manifest and response.manifest.schema:
        columns = [col.name for col in response.manifest.schema.columns]

    return [dict(zip(columns, row)) for row in response.result.data_array]


def escape_sql(value: str) -> str:
    """Single-quote-escape a string for interpolation into a SQL literal."""
    return value.replace("'", "''")
