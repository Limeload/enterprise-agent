"""CRUD helpers for per-user connections — routes between Supabase and local SQLite."""
from __future__ import annotations

from typing import Any

from db.supabase import get_supabase
import db.local_store as _local


def _use_local() -> bool:
    return get_supabase() is None


def list_connections(user_id: str) -> list[dict[str, Any]]:
    if _use_local():
        return _local.list_connections(user_id)
    resp = get_supabase().table("user_connections").select("*").eq("user_id", user_id).execute()
    return resp.data or []


def get_connection(user_id: str, source: str) -> dict[str, Any] | None:
    if _use_local():
        return _local.get_connection(user_id, source)
    resp = (
        get_supabase()
        .table("user_connections")
        .select("*")
        .eq("user_id", user_id)
        .eq("source", source)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    return rows[0] if rows else None


def get_connection_by_composio_id(composio_connection_id: str) -> dict[str, Any] | None:
    if _use_local():
        return _local.get_connection_by_composio_id(composio_connection_id)
    resp = (
        get_supabase()
        .table("user_connections")
        .select("*")
        .eq("composio_connection_id", composio_connection_id)
        .limit(1)
        .execute()
    )
    rows = resp.data or []
    return rows[0] if rows else None


def upsert_connection(
    user_id: str,
    source: str,
    status: str,
    composio_connection_id: str | None = None,
    encrypted_credential: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if _use_local():
        return _local.upsert_connection(
            user_id, source, status, composio_connection_id, encrypted_credential, metadata
        )
    row = {
        "user_id": user_id,
        "source": source,
        "status": status,
        "composio_connection_id": composio_connection_id,
        "encrypted_credential": encrypted_credential,
        "metadata": metadata or {},
    }
    resp = get_supabase().table("user_connections").upsert(row, on_conflict="user_id,source").execute()
    data = resp.data or [row]
    return data[0]


def delete_connection(user_id: str, source: str) -> None:
    if _use_local():
        _local.delete_connection(user_id, source)
        return
    get_supabase().table("user_connections").delete().eq("user_id", user_id).eq("source", source).execute()
