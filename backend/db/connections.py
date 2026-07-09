"""CRUD helpers for per-user connections (legacy — used by non-connector routes)."""
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


def delete_connection(user_id: str, source: str) -> None:
    if _use_local():
        _local.delete_connection(user_id, source)
        return
    get_supabase().table("user_connections").delete().eq("user_id", user_id).eq("source", source).execute()
