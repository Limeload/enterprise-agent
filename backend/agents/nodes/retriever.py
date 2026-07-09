"""Node 4 — Retrieve documents from selected connectors + vector store."""
from __future__ import annotations

import asyncio
from typing import Any

from agents.state import AgentState, RetrievedDoc
from core.pii_masker import mask

# Connector registry is imported lazily to avoid circular imports
from connectors import get_connector


async def _fetch_from_source(
    source: str,
    query: str,
    entities: dict[str, Any],
    user_id: str | None = None,
    limit: int = 5,
) -> list[RetrievedDoc]:
    try:
        connector = await get_connector(source, user_id=user_id)
        if connector is None:
            return []
        if source == "gmail" and any(term in query.lower() for term in ("how many", "count", "rejection", "rejected")):
            limit = max(limit, 50)
        docs = await connector.search(query=query, entities=entities, limit=limit)
        # Mask PII before the docs go into context
        for doc in docs:
            doc["content"] = mask(doc.get("content", ""))
        return docs
    except Exception as exc:
        return []


async def retrieve(state: AgentState) -> AgentState:
    query = state["query"]
    sources = state.get("selected_sources", [])
    entities = state.get("entities", {})
    user_id = state.get("user_id")

    tasks = [
        _fetch_from_source(source, query, entities, user_id=user_id)
        for source in sources
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    docs: list[RetrievedDoc] = []
    for result in results:
        if isinstance(result, list):
            docs.extend(result)

    # Sort by relevance score descending, cap at 20 docs total
    docs.sort(key=lambda d: d.get("score", 0), reverse=True)
    docs = docs[:20]

    return {**state, "retrieved_docs": docs}
