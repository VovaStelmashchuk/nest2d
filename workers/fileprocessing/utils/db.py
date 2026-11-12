"""
Postgres access for the worker. The schema is owned and migrated by the main
Nuxt app (server/db/schema.js); workers only read and write rows.

Binary files live in the `files` table, grouped by `bucket` (the same names as
BUCKET in server/db/files.js).
"""

import os

from dotenv import load_dotenv
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

from .logger import setup_logger

load_dotenv()

logger = setup_logger("db")

BUCKET_USER_DXF = "user_dxf"
BUCKET_VALID_DXF = "valid_dxf"
BUCKET_USER_DXF_SVG = "user_dxf_svg"
BUCKET_NEST_DXF = "nest_dxf"
BUCKET_NEST_SVG = "nest_svg"
BUCKET_STRIP_USER_DXF = "strip_user_dxf"
BUCKET_STRIP_NEST_DXF = "strip_nest_dxf"


def _create_pool() -> ConnectionPool:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        logger.error("Error: 'DATABASE_URL' key not found in environment variables.")
        raise Exception("Postgres connection failed")

    return ConnectionPool(
        database_url,
        min_size=1,
        max_size=4,
        kwargs={"autocommit": True, "row_factory": dict_row},
        check=ConnectionPool.check_connection,
        open=True,
    )


pool = _create_pool()


def execute(query: str, params=None) -> None:
    with pool.connection() as conn:
        conn.execute(query, params)


def fetchone(query: str, params=None):
    with pool.connection() as conn:
        return conn.execute(query, params).fetchone()


def fetchall(query: str, params=None):
    with pool.connection() as conn:
        return conn.execute(query, params).fetchall()


def json(value) -> Jsonb:
    """Wraps a value to be written to a jsonb column."""
    return Jsonb(value)


def read_file(bucket: str, name: str) -> bytes:
    row = fetchone(
        "SELECT data FROM files WHERE bucket = %s AND name = %s",
        (bucket, name),
    )
    if row is None:
        raise FileNotFoundError(f"File {bucket}/{name} not found")
    return bytes(row["data"])


def save_file(bucket: str, name: str, owner_id: str, data: bytes) -> None:
    """Stores a file, replacing any file with the same bucket and name."""
    execute(
        """
        INSERT INTO files (bucket, name, owner_id, data)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (bucket, name)
        DO UPDATE SET owner_id = EXCLUDED.owner_id, data = EXCLUDED.data, created_at = now()
        """,
        (bucket, name, owner_id, data),
    )


def claim_next(table: str, status_column: str, extra_where: str = "", params=()):
    """
    Atomically moves the oldest pending row of `table` to 'processing' and
    returns it, or None when the queue is empty. Safe with many workers.

    `table` and `status_column` are trusted identifiers from the worker code.
    """
    return fetchone(
        f"""
        UPDATE {table} SET {status_column} = 'processing', update_ts = now()
        WHERE id = (
            SELECT id FROM {table}
            WHERE {status_column} = 'pending' {extra_where}
            ORDER BY id
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING *
        """,
        params,
    )
