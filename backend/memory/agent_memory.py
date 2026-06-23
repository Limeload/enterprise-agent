"""Per-user agent memory: episodic, semantic, and preference layers."""
from __future__ import annotations

from typing import Any

from db.supabase import get_supabase


class AgentMemory:
    """Stores and retrieves memories for a given user across sessions."""

    def __init__(self, user_id: str) -> None:
        self.user_id = user_id

    async def save(
        self,
        content: str,
        memory_type: str = "episodic",  # "episodic" | "semantic" | "preference"
        session_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        db = get_supabase()
        db.table("agent_memory").insert({
            "user_id":     self.user_id,
            "session_id":  session_id,
            "memory_type": memory_type,
            "content":     content,
            "metadata":    metadata or {},
        }).execute()

    async def recall(
        self,
        limit: int = 10,
        memory_type: str | None = None,
        session_id: str | None = None,
    ) -> list[dict[str, Any]]:
        db = get_supabase()
        query = (
            db.table("agent_memory")
            .select("*")
            .eq("user_id", self.user_id)
            .order("created_at", desc=True)
            .limit(limit)
        )
        if memory_type:
            query = query.eq("memory_type", memory_type)
        if session_id:
            query = query.eq("session_id", session_id)

        result = query.execute()
        return result.data or []

    async def get_conversation_history(self, session_id: str, limit: int = 20) -> list[dict[str, str]]:
        memories = await self.recall(limit=limit, memory_type="episodic", session_id=session_id)
        history: list[dict[str, str]] = []
        for mem in reversed(memories):
            meta = mem.get("metadata", {})
            role = meta.get("role", "user")
            history.append({"role": role, "content": mem.get("content", "")})
        return history

    async def append_turn(self, session_id: str, role: str, content: str) -> None:
        await self.save(
            content=content,
            memory_type="episodic",
            session_id=session_id,
            metadata={"role": role},
        )
