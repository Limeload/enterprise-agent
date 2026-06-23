"""Node 2 — Select which connectors to query based on intent."""
from __future__ import annotations

from agents.state import AgentState

# Maps intent + sub_intent to prioritized connector lists
_INTENT_SOURCES: dict[str, list[str]] = {
    "knowledge_search": ["notion", "confluence", "google_drive", "sharepoint"],
    "engineering":      ["github", "jira", "gitlab", "linear"],
    "operations":       ["slack", "gmail", "google_calendar", "asana"],
    "executive":        ["jira", "github", "hubspot", "slack", "notion"],
    "action":           [],  # determined per sub_intent
}

_SUB_INTENT_OVERRIDES: dict[str, list[str]] = {
    "find_pr":             ["github", "gitlab"],
    "analyze_pr":          ["github", "gitlab"],
    "create_ticket":       ["jira", "linear"],
    "find_ticket":         ["jira", "linear"],
    "send_email":          ["gmail"],
    "draft_email":         ["gmail"],
    "summarize_meeting":   ["slack", "google_calendar"],
    "post_slack":          ["slack"],
    "find_customer":       ["hubspot", "salesforce", "zendesk"],
    "release_notes":       ["github", "gitlab"],
    "sprint_summary":      ["jira", "linear"],
    "find_policy":         ["notion", "confluence", "google_drive"],
    "search_docs":         ["notion", "confluence", "google_drive"],
    "code_review":         ["github"],
    "find_escalation":     ["zendesk", "intercom", "slack"],
    "weekly_report":       ["jira", "github", "hubspot", "slack"],
}


async def select_sources(state: AgentState) -> AgentState:
    intent = state.get("intent", "knowledge_search")
    sub_intent = state.get("sub_intent", "")
    entities = state.get("entities", {})

    # Sub-intent override takes priority
    if sub_intent in _SUB_INTENT_OVERRIDES:
        sources = list(_SUB_INTENT_OVERRIDES[sub_intent])
    else:
        sources = list(_INTENT_SOURCES.get(intent, ["notion"]))

    # If a specific repo is mentioned, ensure github is included
    if "repo" in entities and "github" not in sources:
        sources.insert(0, "github")

    return {**state, "selected_sources": sources}
