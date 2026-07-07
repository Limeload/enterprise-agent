"""Node 6 — Execute each step in the plan using connector tools."""
from __future__ import annotations

from typing import Any

from agents.state import AgentState, ToolCall
from connectors import get_connector

_TOOL_CONNECTOR_MAP: dict[str, tuple[str, str]] = {
    "gmail_search":            ("gmail", "search_emails"),
    "gmail_get_email":         ("gmail", "get_email"),
    "gmail_draft":             ("gmail", "draft_email"),
    "gmail_send":              ("gmail", "send_email"),
    "google_drive_search":     ("google_drive", "search_files"),
    "google_calendar_events":  ("google_calendar", "list_events"),
    "github_get_pr":           ("github", "get_pr"),
    "github_search_issues":    ("github", "search_issues"),
    "github_create_issue":     ("github", "create_issue"),
    "notion_search":           ("notion", "search"),
    "notion_get_page":         ("notion", "get_page"),
    "slack_search":            ("slack", "search"),
    "slack_post_message":      ("slack", "post_message"),
    "slack_list_channels":     ("slack", "list_channels"),
    "hubspot_search_contacts": ("hubspot", "search_contacts"),
    "hubspot_get_deal":        ("hubspot", "get_deal"),
    "jira_search_tickets":     ("jira", "search_tickets"),
    "jira_get_ticket":         ("jira", "get_ticket"),
    "jira_create_ticket":      ("jira", "create_ticket"),
    "jira_update_ticket":      ("jira", "update_ticket"),
    "confluence_search":       ("confluence", "search"),
    "salesforce_query":        ("salesforce", "query"),
    "zendesk_search":          ("zendesk", "search"),
    "zendesk_list_tickets":    ("zendesk", "list_tickets"),
    "teams_search":            ("microsoft_teams", "search_messages"),
    "onedrive_search":         ("onedrive", "search_files"),
    "vector_search":           ("vector", "search"),
    "synthesize_answer":       (None, None),
}


async def _run_tool(tool: str, args: dict[str, Any], user_id: str | None = None) -> tuple[Any, str | None]:
    mapping = _TOOL_CONNECTOR_MAP.get(tool)
    if mapping is None or mapping[0] is None:
        return None, None

    connector_name, method_name = mapping
    connector = await get_connector(connector_name, user_id=user_id)
    if connector is None:
        return None, f"Connector '{connector_name}' not available or not connected"

    try:
        method = getattr(connector, method_name)
        result = await method(**args)
        return result, None
    except Exception as exc:
        return None, str(exc)


async def execute_tools(state: AgentState) -> AgentState:
    steps = state.get("plan", [])
    user_id = state.get("user_id")
    tool_calls: list[ToolCall] = []

    for step in steps:
        tool = step.get("tool", "")
        args = step.get("args", {})
        result, error = await _run_tool(tool, args, user_id=user_id)
        tool_calls.append(ToolCall(tool=tool, args=args, result=result, error=error))

    return {**state, "tool_calls": tool_calls}
