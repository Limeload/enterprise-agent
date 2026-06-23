"""Node 6 — Execute each step in the plan using connector tools."""
from __future__ import annotations

import asyncio
from typing import Any

from agents.state import AgentState, ToolCall
from connectors import get_connector

_TOOL_CONNECTOR_MAP: dict[str, tuple[str, str]] = {
    "github_get_pr":          ("github", "get_pr"),
    "github_search_issues":   ("github", "search_issues"),
    "github_create_issue":    ("github", "create_issue"),
    "notion_search":          ("notion", "search"),
    "notion_get_page":        ("notion", "get_page"),
    "slack_search":           ("slack", "search"),
    "slack_post_message":     ("slack", "post_message"),
    "hubspot_search_contacts":("hubspot", "search_contacts"),
    "hubspot_get_deal":       ("hubspot", "get_deal"),
    "jira_get_ticket":        ("jira", "get_ticket"),
    "jira_create_ticket":     ("jira", "create_ticket"),
    "jira_update_ticket":     ("jira", "update_ticket"),
    "gmail_send":             ("gmail", "send"),
    "gmail_draft":            ("gmail", "draft"),
    "vector_search":          ("vector", "search"),
    "synthesize_answer":      (None, None),   # handled by answer generator
}


async def _run_tool(tool: str, args: dict[str, Any]) -> tuple[Any, str | None]:
    mapping = _TOOL_CONNECTOR_MAP.get(tool)
    if mapping is None or mapping[0] is None:
        return None, None  # synthesize_answer is a no-op here

    connector_name, method_name = mapping
    connector = get_connector(connector_name)
    if connector is None:
        return None, f"Connector '{connector_name}' not available"

    try:
        method = getattr(connector, method_name)
        result = await method(**args)
        return result, None
    except Exception as exc:
        return None, str(exc)


async def execute_tools(state: AgentState) -> AgentState:
    steps = state.get("plan", [])
    tool_calls: list[ToolCall] = []

    for step in steps:
        tool = step.get("tool", "")
        args = step.get("args", {})

        result, error = await _run_tool(tool, args)
        tool_calls.append(ToolCall(tool=tool, args=args, result=result, error=error))

    return {**state, "tool_calls": tool_calls}
