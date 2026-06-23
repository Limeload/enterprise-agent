"""Node 7 — Synthesize the final answer with citations."""
from __future__ import annotations

import json
from anthropic import AsyncAnthropic

from agents.state import AgentState, Citation
from core.config import settings

_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

_SYSTEM = """You are an enterprise AI assistant. Synthesize a clear, accurate answer
from the provided context. Always cite your sources inline using [Source N] notation.
If the context is insufficient, say so honestly.
Return a JSON object: {"answer": str, "citations": [{"source": str, "title": str, "url": str, "excerpt": str}]}"""


async def generate_answer(state: AgentState) -> AgentState:
    # Short-circuit on permission denial
    if not state.get("permission_granted", True) and state.get("answer"):
        return state

    query = state["query"]
    docs = state.get("retrieved_docs", [])
    tool_calls = state.get("tool_calls", [])
    error = state.get("error")

    if error:
        return {**state, "answer": f"An error occurred: {error}", "citations": []}

    context_parts = []
    for i, doc in enumerate(docs[:10], 1):
        context_parts.append(
            f"[Source {i}] ({doc['source']}) {doc['title']}\nURL: {doc.get('url', '')}\n{doc['content'][:600]}"
        )

    for call in tool_calls:
        if call.get("result") and call["tool"] != "synthesize_answer":
            context_parts.append(f"[Tool: {call['tool']}]\n{json.dumps(call['result'])[:400]}")

    context = "\n\n---\n\n".join(context_parts) if context_parts else "No context retrieved."

    prompt = f"Context:\n{context}\n\nUser question: {query}"

    response = await _client.messages.create(
        model=settings.llm_model,
        max_tokens=1024,
        system=_SYSTEM,
        messages=[{"role": "user", "content": prompt}],
    )

    try:
        parsed = json.loads(response.content[0].text)
        answer = parsed.get("answer", "")
        citations: list[Citation] = parsed.get("citations", [])
    except (json.JSONDecodeError, IndexError, KeyError):
        answer = response.content[0].text if response.content else "Unable to generate answer."
        citations = []

    return {**state, "answer": answer, "citations": citations}
