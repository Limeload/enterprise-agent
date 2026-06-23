"""Node 3 — Validate user has permission to access selected sources."""
from __future__ import annotations

from core.security import check_source_permission, check_action_permission, Role, User
from agents.state import AgentState


async def validate_permissions(state: AgentState) -> AgentState:
    user_id = state.get("user_id", "anonymous")
    intent = state.get("intent", "knowledge_search")
    selected_sources = state.get("selected_sources", [])

    # In production, fetch the real user from DB; here we mock an admin for dev
    user = User(
        user_id=user_id,
        email=f"{user_id}@company.com",
        role=Role.ADMIN,
    )

    # Check action permission for write intents
    if intent == "action":
        action_ok = check_action_permission(user, "write")
        if not action_ok:
            return {
                **state,
                "permission_granted": False,
                "denied_sources": selected_sources,
                "answer": "You don't have permission to perform write actions. Contact your admin.",
            }

    allowed = []
    denied = []
    for source in selected_sources:
        if check_source_permission(user, source):
            allowed.append(source)
        else:
            denied.append(source)

    return {
        **state,
        "selected_sources": allowed,
        "denied_sources": denied,
        "permission_granted": len(allowed) > 0,
    }
