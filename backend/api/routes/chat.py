"""POST /chat — streaming chat endpoint powered by the LangGraph agent pipeline."""
from __future__ import annotations

import json
import uuid
from typing import AsyncIterator

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.graph import graph
from agents.state import AgentState
from api.deps import get_current_user
from core.security import User
from memory.agent_memory import AgentMemory

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    session_id: str
    answer: str
    citations: list[dict]
    intent: str
    sources_used: list[str]
    audit_event_id: str | None


async def _stream_graph(state: AgentState) -> AsyncIterator[str]:
    """Run the LangGraph graph and stream SSE events back to the client."""
    config = {"configurable": {"thread_id": state["session_id"]}}

    async for event in graph.astream_events(state, config=config, version="v2"):
        kind = event.get("event", "")

        if kind == "on_chain_start":
            node = event.get("name", "")
            yield f"data: {json.dumps({'type': 'node_start', 'node': node})}\n\n"

        elif kind == "on_chain_end":
            node = event.get("name", "")
            output = event.get("data", {}).get("output", {})
            if node == "generate_answer":
                answer = output.get("answer", "") if isinstance(output, dict) else ""
                yield f"data: {json.dumps({'type': 'answer_chunk', 'content': answer})}\n\n"

    # Final metadata event
    yield f"data: {json.dumps({'type': 'done'})}\n\n"


@router.post("/stream")
async def chat_stream(
    req: ChatRequest,
    user: User = Depends(get_current_user),
) -> StreamingResponse:
    session_id = req.session_id or str(uuid.uuid4())
    memory = AgentMemory(user.user_id)

    # Load conversation history
    history = await memory.get_conversation_history(session_id)

    initial_state: AgentState = {
        "query": req.message,
        "user_id": user.user_id,
        "session_id": session_id,
        "conversation_history": history,
        "intent": "",
        "intent_confidence": 0.0,
        "sub_intent": "",
        "entities": {},
        "selected_sources": [],
        "permission_granted": False,
        "denied_sources": [],
        "retrieved_docs": [],
        "plan": [],
        "tool_calls": [],
        "requires_human_approval": False,
        "human_approved": None,
        "answer": "",
        "citations": [],
        "audit_event_id": None,
        "error": None,
        "error_node": None,
    }

    # Persist user turn
    await memory.append_turn(session_id, "user", req.message)

    return StreamingResponse(
        _stream_graph(initial_state),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Session-Id": session_id,
        },
    )


@router.post("", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    user: User = Depends(get_current_user),
) -> ChatResponse:
    """Non-streaming chat — waits for the full agent run and returns JSON."""
    session_id = req.session_id or str(uuid.uuid4())
    memory = AgentMemory(user.user_id)
    history = await memory.get_conversation_history(session_id)

    initial_state: AgentState = {
        "query": req.message,
        "user_id": user.user_id,
        "session_id": session_id,
        "conversation_history": history,
        "intent": "",
        "intent_confidence": 0.0,
        "sub_intent": "",
        "entities": {},
        "selected_sources": [],
        "permission_granted": False,
        "denied_sources": [],
        "retrieved_docs": [],
        "plan": [],
        "tool_calls": [],
        "requires_human_approval": False,
        "human_approved": None,
        "answer": "",
        "citations": [],
        "audit_event_id": None,
        "error": None,
        "error_node": None,
    }

    config = {"configurable": {"thread_id": session_id}}
    final_state = await graph.ainvoke(initial_state, config=config)

    await memory.append_turn(session_id, "assistant", final_state.get("answer", ""))

    return ChatResponse(
        session_id=session_id,
        answer=final_state.get("answer", ""),
        citations=final_state.get("citations", []),
        intent=final_state.get("intent", ""),
        sources_used=list({d.get("source") for d in final_state.get("retrieved_docs", [])}),
        audit_event_id=final_state.get("audit_event_id"),
    )
