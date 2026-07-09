"""Node 5 — Create an execution plan from intent + retrieved context."""
from __future__ import annotations

import json

from agents.state import AgentState
from core.llm import generate_text
from core.config import settings

_SYSTEM = """You are a planning agent for an enterprise AI assistant.
Given the user's intent, sub-intent, entities, and retrieved context snippets,
produce a JSON array of steps the tool executor should run.

Each step has:
  {"step": int, "tool": str, "args": dict, "description": str}

Available tools:
  github_get_pr, github_search_issues, github_create_issue,
  notion_search, notion_get_page,
  slack_search, slack_post_message,
  hubspot_search_contacts, hubspot_get_deal,
  jira_get_ticket, jira_create_ticket, jira_update_ticket,
  gmail_send, gmail_draft,
  vector_search,
  synthesize_answer   (always include as last step)

Only include steps that are necessary. Output ONLY valid JSON array."""


async def plan(state: AgentState) -> AgentState:
    intent = state.get("intent", "knowledge_search")
    sub_intent = state.get("sub_intent", "")
    entities = state.get("entities", {})
    docs = state.get("retrieved_docs", [])

    doc_snippets = "\n".join(
        f"[{d['source']}] {d['title']}: {d['content'][:300]}"
        for d in docs[:5]
    )

    prompt = (
        f"Intent: {intent}\n"
        f"Sub-intent: {sub_intent}\n"
        f"Entities: {json.dumps(entities)}\n\n"
        f"Retrieved context:\n{doc_snippets}\n\n"
        f"User query: {state['query']}\n\n"
        "Produce the execution plan."
    )

    text = await generate_text(
        model=settings.llm_model,
        max_tokens=512,
        system=_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        steps = json.loads(text)
        if not isinstance(steps, list):
            raise ValueError
    except (json.JSONDecodeError, ValueError):
        steps = [{"step": 1, "tool": "synthesize_answer", "args": {}, "description": "Generate answer from context"}]

    # Flag write actions for human approval
    write_tools = {"github_create_issue", "jira_create_ticket", "jira_update_ticket", "slack_post_message", "gmail_send"}
    requires_approval = any(s.get("tool") in write_tools for s in steps)

    return {**state, "plan": steps, "requires_human_approval": requires_approval}
