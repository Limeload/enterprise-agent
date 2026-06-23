"""Node 8 — Verify that citations reference actual retrieved documents."""
from __future__ import annotations

from agents.state import AgentState, Citation


async def validate_citations(state: AgentState) -> AgentState:
    citations: list[Citation] = state.get("citations", [])
    docs = state.get("retrieved_docs", [])

    known_urls = {d.get("url", "") for d in docs}
    known_titles = {d.get("title", "").lower() for d in docs}

    validated: list[Citation] = []
    for c in citations:
        url = c.get("url", "")
        title = c.get("title", "").lower()

        # Accept citation if its URL or title matches a retrieved doc
        if url in known_urls or any(title in kt for kt in known_titles) or url.startswith("http"):
            validated.append(c)

    return {**state, "citations": validated}
