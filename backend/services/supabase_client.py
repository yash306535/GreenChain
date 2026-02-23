import asyncio
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from .postgres_client import _get_pool


_IDENT_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def _safe_ident(name: str) -> str:
    if not _IDENT_RE.match(name):
        raise ValueError(f"Invalid SQL identifier: {name}")
    return f'"{name}"'


def _safe_select_columns(columns: str) -> str:
    if columns.strip() == "*":
        return "*"
    out: list[str] = []
    for raw in columns.split(","):
        col = raw.strip()
        if not col:
            continue
        out.append(_safe_ident(col))
    if not out:
        return "*"
    return ", ".join(out)


@dataclass
class _CompatError:
    message: str


@dataclass
class _CompatResponse:
    data: Any = None
    error: _CompatError | None = None


class _TableQuery:
    def __init__(self, table: str) -> None:
        self.table = table
        self._mode: str | None = None
        self._select_cols: str = "*"
        self._filters: list[tuple[str, str, Any]] = []
        self._order_by: tuple[str, bool] | None = None
        self._limit: int | None = None
        self._single = False
        self._insert_payload: dict[str, Any] | list[dict[str, Any]] | None = None
        self._update_payload: dict[str, Any] | None = None
        self._upsert_payload: dict[str, Any] | list[dict[str, Any]] | None = None
        self._on_conflict: str | None = None

    def select(self, columns: str = "*") -> "_TableQuery":
        self._mode = "select"
        self._select_cols = columns
        return self

    def insert(self, payload: dict[str, Any] | list[dict[str, Any]]) -> "_TableQuery":
        self._mode = "insert"
        self._insert_payload = payload
        return self

    def update(self, payload: dict[str, Any]) -> "_TableQuery":
        self._mode = "update"
        self._update_payload = payload
        return self

    def upsert(
        self, payload: dict[str, Any] | list[dict[str, Any]], on_conflict: str | None = None
    ) -> "_TableQuery":
        self._mode = "upsert"
        self._upsert_payload = payload
        self._on_conflict = on_conflict
        return self

    def eq(self, column: str, value: Any) -> "_TableQuery":
        self._filters.append(("eq", column, value))
        return self

    def in_(self, column: str, values: list[Any]) -> "_TableQuery":
        self._filters.append(("in", column, values))
        return self

    def order(self, column: str, desc: bool = False) -> "_TableQuery":
        self._order_by = (column, desc)
        return self

    def limit(self, count: int) -> "_TableQuery":
        self._limit = count
        return self

    def single(self) -> "_TableQuery":
        self._single = True
        self._limit = 1
        return self

    async def execute(self) -> _CompatResponse:
        try:
            data = await asyncio.to_thread(self._execute_sync)
            return _CompatResponse(data=data, error=None)
        except Exception as exc:
            return _CompatResponse(data=None, error=_CompatError(message=str(exc)))

    def _execute_sync(self) -> Any:
        if self._mode == "select":
            return self._run_select()
        if self._mode == "insert":
            return self._run_insert()
        if self._mode == "update":
            return self._run_update()
        if self._mode == "upsert":
            return self._run_upsert()
        raise RuntimeError("No query mode selected")

    def _build_where_clause(self) -> tuple[str, list[Any]]:
        if not self._filters:
            return "", []
        parts: list[str] = []
        params: list[Any] = []
        for op, col, value in self._filters:
            col_sql = _safe_ident(col)
            if op == "eq":
                parts.append(f"{col_sql} = %s")
                params.append(value)
            elif op == "in":
                if not value:
                    parts.append("1 = 0")
                else:
                    placeholders = ", ".join(["%s"] * len(value))
                    parts.append(f"{col_sql} IN ({placeholders})")
                    params.extend(value)
            else:
                raise RuntimeError(f"Unsupported filter op: {op}")
        return " WHERE " + " AND ".join(parts), params

    def _run_select(self) -> Any:
        table_sql = _safe_ident(self.table)
        cols_sql = _safe_select_columns(self._select_cols)
        where_sql, params = self._build_where_clause()
        order_sql = ""
        if self._order_by:
            col, desc = self._order_by
            order_sql = f" ORDER BY {_safe_ident(col)} {'DESC' if desc else 'ASC'}"
        limit_sql = ""
        if self._limit is not None:
            limit_sql = " LIMIT %s"
            params.append(self._limit)
        sql = f"SELECT {cols_sql} FROM {table_sql}{where_sql}{order_sql}{limit_sql}"
        rows = _query(sql, tuple(params), fetch="all")
        if self._single:
            return rows[0] if rows else None
        return rows

    def _run_insert(self) -> list[dict[str, Any]]:
        payload = self._insert_payload
        if payload is None:
            raise RuntimeError("Insert payload required")
        rows = payload if isinstance(payload, list) else [payload]
        if not rows:
            return []
        return _insert_rows(self.table, rows)

    def _run_update(self) -> list[dict[str, Any]]:
        payload = self._update_payload
        if not payload:
            raise RuntimeError("Update payload required")
        table_sql = _safe_ident(self.table)
        set_cols = list(payload.keys())
        set_sql = ", ".join([f"{_safe_ident(c)} = %s" for c in set_cols])
        params: list[Any] = [payload[c] for c in set_cols]
        where_sql, where_params = self._build_where_clause()
        params.extend(where_params)
        sql = f"UPDATE {table_sql} SET {set_sql}{where_sql} RETURNING *"
        return _query(sql, tuple(params), fetch="all", commit=True)

    def _run_upsert(self) -> list[dict[str, Any]]:
        payload = self._upsert_payload
        if payload is None:
            raise RuntimeError("Upsert payload required")
        rows = payload if isinstance(payload, list) else [payload]
        if not rows:
            return []
        return _upsert_rows(self.table, rows, on_conflict=self._on_conflict)


class _RpcQuery:
    def __init__(self, fn_name: str) -> None:
        self.fn_name = fn_name

    async def execute(self) -> _CompatResponse:
        try:
            data = await asyncio.to_thread(self._execute_sync)
            return _CompatResponse(data=data, error=None)
        except Exception as exc:
            return _CompatResponse(data=None, error=_CompatError(message=str(exc)))

    def _execute_sync(self) -> list[dict[str, Any]]:
        fn_sql = _safe_ident(self.fn_name)
        sql = f"SELECT * FROM {fn_sql}()"
        return _query(sql, (), fetch="all")


class _PostgresSupabaseCompatClient:
    def table(self, name: str) -> _TableQuery:
        return _TableQuery(name)

    def rpc(self, name: str) -> _RpcQuery:
        return _RpcQuery(name)


def _query(
    sql: str, params: tuple[Any, ...], fetch: str = "all", commit: bool = False
) -> list[dict[str, Any]]:
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            cols = [d[0] for d in cur.description] if cur.description else []
            rows = cur.fetchall() if fetch == "all" and cur.description else []
            if commit:
                conn.commit()
            return [dict(zip(cols, row)) for row in rows]
    except Exception:
        if commit:
            conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def _insert_rows(table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    table_sql = _safe_ident(table)
    cols = list(rows[0].keys())
    cols_sql = ", ".join(_safe_ident(c) for c in cols)
    value_sql = ", ".join(["%s"] * len(cols))
    all_rows: list[dict[str, Any]] = []
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            for row in rows:
                params = tuple(row.get(c) for c in cols)
                cur.execute(
                    f"INSERT INTO {table_sql} ({cols_sql}) VALUES ({value_sql}) RETURNING *",
                    params,
                )
                ret_cols = [d[0] for d in cur.description]
                ret_row = cur.fetchone()
                all_rows.append(dict(zip(ret_cols, ret_row)))
            conn.commit()
            return all_rows
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


def _upsert_rows(
    table: str, rows: list[dict[str, Any]], on_conflict: str | None = None
) -> list[dict[str, Any]]:
    if not on_conflict:
        raise RuntimeError("Upsert requires on_conflict")
    table_sql = _safe_ident(table)
    conflict_col = on_conflict.strip()
    cols = list(rows[0].keys())
    cols_sql = ", ".join(_safe_ident(c) for c in cols)
    value_sql = ", ".join(["%s"] * len(cols))
    update_cols = [c for c in cols if c != conflict_col]
    if not update_cols:
        raise RuntimeError("Upsert requires at least one non-conflict column")
    update_sql = ", ".join(
        f"{_safe_ident(c)} = EXCLUDED.{_safe_ident(c)}" for c in update_cols
    )
    all_rows: list[dict[str, Any]] = []
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            for row in rows:
                params = tuple(row.get(c) for c in cols)
                cur.execute(
                    f"""
                    INSERT INTO {table_sql} ({cols_sql})
                    VALUES ({value_sql})
                    ON CONFLICT ({_safe_ident(conflict_col)}) DO UPDATE
                    SET {update_sql}
                    RETURNING *
                    """,
                    params,
                )
                ret_cols = [d[0] for d in cur.description]
                ret_row = cur.fetchone()
                all_rows.append(dict(zip(ret_cols, ret_row)))
            conn.commit()
            return all_rows
    except Exception:
        conn.rollback()
        raise
    finally:
        pool.putconn(conn)


@lru_cache(maxsize=1)
def _get_client() -> Any:
    if not os.getenv("DATABASE_URL"):
        raise RuntimeError("DATABASE_URL must be set")
    return _PostgresSupabaseCompatClient()


async def get_supabase_client() -> Any:
    """Compatibility client backed by PostgreSQL DATABASE_URL."""
    return _get_client()
