"""Node 1 — Classify user intent and extract entities."""
from __future__ import annotations

import json
from anthropic import AsyncAnthropic

from agents.state import AgentState
from core.config import settings

_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

_SYSTEM = """You are an intent classification engine for an enterprise AI assistant.
Classify the user query into one of these intents:
- knowledge_search: finding docs, policies, or information
- engineering: GitHub PRs, Jira tickets, deployments, code
- operations: Slack messages, meetings, customer escalations
- executive: high-level summaries, risks, priorities
- action: performing write operations (send email, create ticket, post Slack message)

Also extract:
- sub_intent: a more specific label (e.g. "find_pr", "summarize_meeting", "create_ticket")
- entities: relevant named things from the query (repo, ticket_id, person, date_range, etc.)
- confidence: float 0-1

Respond ONLY with valid JSON matching this schema:
{"intent": str, "sub_intent": str, "entities": dict, "confidence": float}"""


async def classify_intent(state: AgentState) -> AgentState:
    query = state["query"]
    history = state.get("conversation_history", [])

    messages = [
        *[{"role": m["role"], "content": m["content"]} for m in history[-6:]],
        {"role": "user", "content": query},
    ]

    response = await _client.messages.create(
        model=settings.llm_model,
        max_tokens=256,
        system=_SYSTEM,
        messages=messages,
    )

    try:
        parsed = json.loads(response.content[0].text)
    except (json.JSONDecodeError, IndexError, KeyError):
        parsed = {
            "intent": "knowledge_search",
            "sub_intent": "general",
            "entities": {},
            "confidence": 0.5,
        }

    return {
        **state,
        "intent": parsed.get("intent", "knowledge_search"),
        "sub_intent": parsed.get("sub_intent", "general"),
        "entities": parsed.get("entities", {}),
        "intent_confidence": parsed.get("confidence", 0.5),
    }
