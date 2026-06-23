"""Structured audit logging — every agent action is recorded."""
from __future__ import annotations

import time
import uuid
from datetime import datetime, timezone
from typing import Any

import structlog

log = structlog.get_logger(__name__)


class AuditEvent:
    __slots__ = (
        "event_id", "timestamp", "user_id", "session_id",
        "action", "sources_accessed", "query", "result_summary",
        "tool_calls", "approved_by_human", "metadata",
    )

    def __init__(
        self,
        user_id: str,
        session_id: str,
        action: str,
        query: str,
        sources_accessed: list[str] | None = None,
        result_summary: str = "",
        tool_calls: list[dict] | None = None,
        approved_by_human: bool = False,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.event_id = str(uuid.uuid4())
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.user_id = user_id
        self.session_id = session_id
        self.action = action
        self.query = query
        self.sources_accessed = sources_accessed or []
        self.result_summary = result_summary
        self.tool_calls = tool_calls or []
        self.approved_by_human = approved_by_human
        self.metadata = metadata or {}

    def to_dict(self) -> dict[str, Any]:
        return {k: getattr(self, k) for k in self.__slots__}


class AuditLogger:
    """Logs to structlog (and optionally to Supabase audit table)."""

    def __init__(self, db_client=None) -> None:
        self._db = db_client

    async def log(self, event: AuditEvent) -> None:
        log.info("audit_event", **event.to_dict())

        if self._db:
            await self._persist(event)

    async def _persist(self, event: AuditEvent) -> None:
        try:
            self._db.table("audit_logs").insert(event.to_dict()).execute()
        except Exception:
            log.exception("audit_persist_failed", event_id=event.event_id)


_default_logger = AuditLogger()


async def record(
    user_id: str,
    session_id: str,
    action: str,
    query: str,
    **kwargs,
) -> AuditEvent:
    event = AuditEvent(user_id=user_id, session_id=session_id, action=action, query=query, **kwargs)
    await _default_logger.log(event)
    return event
