import os
from functools import lru_cache
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool


@lru_cache(maxsize=1)
def _get_pool() -> SimpleConnectionPool:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL must be set")
    return SimpleConnectionPool(minconn=1, maxconn=5, dsn=database_url)


def pg_fetch_all(query: str, params: tuple[Any, ...] | None = None) -> list[dict[str, Any]]:
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    finally:
        pool.putconn(conn)


def pg_fetch_one(query: str, params: tuple[Any, ...] | None = None) -> dict[str, Any] | None:
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            row = cur.fetchone()
            return dict(row) if row else None
    finally:
        pool.putconn(conn)


def pg_execute_returning(
    query: str, params: tuple[Any, ...] | None = None
) -> list[dict[str, Any]]:
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            rows = cur.fetchall() if cur.description else []
            conn.commit()
            return [dict(r) for r in rows]
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)
