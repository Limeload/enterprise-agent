"""Per-user agent memory: episodic, semantic, and preference layers."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from db.supabase import get_supabase

_local_memory: list[dict[str, Any]] = []


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
        if db is None:
            _local_memory.append({
                "user_id": self.user_id,
                "session_id": session_id,
                "memory_type": memory_type,
                "content": content,
                "metadata": metadata or {},
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            return

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
        if db is None:
            memories = [m for m in _local_memory if m["user_id"] == self.user_id]
            if memory_type:
                memories = [m for m in memories if m["memory_type"] == memory_type]
            if session_id:
                memories = [m for m in memories if m["session_id"] == session_id]
            return sorted(memories, key=lambda m: m["created_at"], reverse=True)[:limit]

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
