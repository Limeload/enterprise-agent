"""SQLite-backed store for users and per-user connections (dev / no-Supabase mode)."""
from __future__ import annotations

import json
import sqlite3
import threading
from pathlib import Path
from typing import Any

_DB_PATH = Path(__file__).parent.parent / "data" / "local.db"
_lock = threading.Lock()


def _conn() -> sqlite3.Connection:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
    con.row_factory = sqlite3.Row
    return con


def init_db() -> None:
    with _lock, _conn() as con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                user_id   TEXT PRIMARY KEY,
                email     TEXT UNIQUE NOT NULL,
                password  TEXT NOT NULL,
                role      TEXT NOT NULL DEFAULT 'viewer',
                created_at TEXT DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS user_connections (
                user_id               TEXT NOT NULL,
                source                TEXT NOT NULL,
                status                TEXT NOT NULL,
                composio_connection_id TEXT,
                encrypted_credential  TEXT,
                metadata              TEXT DEFAULT '{}',
                updated_at            TEXT DEFAULT (datetime('now')),
                PRIMARY KEY (user_id, source)
            );
        """)


# ---------------------------------------------------------------------------
# User CRUD
# ---------------------------------------------------------------------------

def create_user(user_id: str, email: str, hashed_password: str, role: str = "viewer") -> dict[str, Any]:
    with _lock, _conn() as con:
        con.execute(
            "INSERT INTO users (user_id, email, password, role) VALUES (?,?,?,?)",
            (user_id, email, hashed_password, role),
        )
    return {"user_id": user_id, "email": email, "role": role}


def get_user_by_email(email: str) -> dict[str, Any] | None:
    with _lock, _conn() as con:
        row = con.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    with _lock, _conn() as con:
        row = con.execute("SELECT * FROM users WHERE user_id=?", (user_id,)).fetchone()
    return dict(row) if row else None


# ---------------------------------------------------------------------------
# Connection CRUD (mirrors db/connections.py interface)
# ---------------------------------------------------------------------------

def list_connections(user_id: str) -> list[dict[str, Any]]:
    with _lock, _conn() as con:
        rows = con.execute(
            "SELECT * FROM user_connections WHERE user_id=?", (user_id,)
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_connection(user_id: str, source: str) -> dict[str, Any] | None:
    with _lock, _conn() as con:
        row = con.execute(
            "SELECT * FROM user_connections WHERE user_id=? AND source=?", (user_id, source)
        ).fetchone()
    return _row_to_dict(row) if row else None


def get_connection_by_composio_id(composio_connection_id: str) -> dict[str, Any] | None:
    with _lock, _conn() as con:
        row = con.execute(
            "SELECT * FROM user_connections WHERE composio_connection_id=?",
            (composio_connection_id,),
        ).fetchone()
    return _row_to_dict(row) if row else None


def upsert_connection(
    user_id: str,
    source: str,
    status: str,
    composio_connection_id: str | None = None,
    encrypted_credential: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    row = {
        "user_id": user_id,
        "source": source,
        "status": status,
        "composio_connection_id": composio_connection_id,
        "encrypted_credential": encrypted_credential,
        "metadata": json.dumps(metadata or {}),
    }
    with _lock, _conn() as con:
        con.execute(
            """
            INSERT INTO user_connections
                (user_id, source, status, composio_connection_id, encrypted_credential, metadata)
            VALUES (:user_id, :source, :status, :composio_connection_id, :encrypted_credential, :metadata)
            ON CONFLICT(user_id, source) DO UPDATE SET
                status=excluded.status,
                composio_connection_id=excluded.composio_connection_id,
                encrypted_credential=excluded.encrypted_credential,
                metadata=excluded.metadata,
                updated_at=datetime('now')
            """,
            row,
        )
    return {**row, "metadata": metadata or {}}


def delete_connection(user_id: str, source: str) -> None:
    with _lock, _conn() as con:
        con.execute(
            "DELETE FROM user_connections WHERE user_id=? AND source=?", (user_id, source)
        )


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    d = dict(row)
    if "metadata" in d and isinstance(d["metadata"], str):
        try:
            d["metadata"] = json.loads(d["metadata"])
        except Exception:
            d["metadata"] = {}
    return d
