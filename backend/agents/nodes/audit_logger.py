"""Node 9 — Record the completed interaction to the audit log."""
from __future__ import annotations

from agents.state import AgentState
from core import audit


async def log_audit(state: AgentState) -> AgentState:
    sources = list({d.get("source", "") for d in state.get("retrieved_docs", [])})
    tool_names = [c.get("tool") for c in state.get("tool_calls", [])]

    event = await audit.record(
        user_id=state.get("user_id", "anonymous"),
        session_id=state.get("session_id", ""),
        action=state.get("intent", "unknown"),
        query=state.get("query", ""),
        sources_accessed=sources,
        result_summary=state.get("answer", "")[:200],
        tool_calls=[{"tool": c.get("tool"), "error": c.get("error")} for c in state.get("tool_calls", [])],
        approved_by_human=state.get("human_approved", False),
    )

    return {**state, "audit_event_id": event.event_id}
