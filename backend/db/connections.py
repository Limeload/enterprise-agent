"""CRUD helpers for the per-user `user_connections` table."""
from __future__ import annotations

from typing import Any

from db.supabase import get_supabase


def list_connections(user_id: str) -> list[dict[str, Any]]:
    resp = get_supabase().table("user_connections").select("*").eq("user_id", user_id).execute()
    return resp.data or []


def get_connection(user_id: str, source: str) -> dict[str, Any] | None:
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
    get_supabase().table("user_connections").delete().eq("user_id", user_id).eq("source", source).execute()
