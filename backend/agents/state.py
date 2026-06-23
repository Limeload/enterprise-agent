"""Shared state that flows through the LangGraph agent pipeline."""
from __future__ import annotations

from typing import Any, Optional
from typing_extensions import TypedDict


class RetrievedDoc(TypedDict):
    source: str          # connector name, e.g. "github"
    doc_id: str
    title: str
    content: str
    url: str
    score: float         # relevance score 0-1
    metadata: dict[str, Any]


class ToolCall(TypedDict):
    tool: str
    args: dict[str, Any]
    result: Any
    error: Optional[str]


class Citation(TypedDict):
    source: str
    title: str
    url: str
    excerpt: str


class AgentState(TypedDict):
    # ---- Input ----
    query: str
    user_id: str
    session_id: str
    conversation_history: list[dict[str, str]]

    # ---- Intent classification ----
    intent: str                      # "knowledge_search" | "engineering" | "operations" | "executive" | "action"
    intent_confidence: float
    sub_intent: str                  # e.g. "find_pr", "send_email", "summarize_meeting"
    entities: dict[str, Any]         # extracted entities (repo name, ticket id, etc.)

    # ---- Source selection ----
    selected_sources: list[str]      # e.g. ["github", "notion"]

    # ---- Permission validation ----
    permission_granted: bool
    denied_sources: list[str]

    # ---- Retrieval ----
    retrieved_docs: list[RetrievedDoc]

    # ---- Planning ----
    plan: list[dict[str, Any]]       # ordered list of steps the executor will run

    # ---- Tool execution ----
    tool_calls: list[ToolCall]
    requires_human_approval: bool
    human_approved: Optional[bool]

    # ---- Answer generation ----
    answer: str
    citations: list[Citation]

    # ---- Audit ----
    audit_event_id: Optional[str]

    # ---- Error handling ----
    error: Optional[str]
    error_node: Optional[str]
