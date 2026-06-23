"""
Main LangGraph agent pipeline.

Flow:
  classify_intent
    → select_sources
      → validate_permissions
        → retrieve
          → plan
            → execute_tools
              → [human_approval? wait : continue]
                → generate_answer
                  → validate_citations
                    → log_audit
                      → END
"""
from __future__ import annotations

from langgraph.graph import END, StateGraph
from langgraph.checkpoint.memory import MemorySaver

from agents.state import AgentState
from agents.nodes.intent_classifier import classify_intent
from agents.nodes.source_selector import select_sources
from agents.nodes.permission_validator import validate_permissions
from agents.nodes.retriever import retrieve
from agents.nodes.planner import plan
from agents.nodes.tool_executor import execute_tools
from agents.nodes.answer_generator import generate_answer
from agents.nodes.citation_validator import validate_citations
from agents.nodes.audit_logger import log_audit


def _route_after_permissions(state: AgentState) -> str:
    if not state.get("permission_granted"):
        return "generate_answer"   # short-circuit with a permission-denied message
    return "retrieve"


def _route_after_execution(state: AgentState) -> str:
    if state.get("requires_human_approval") and not state.get("human_approved"):
        return "await_human_approval"
    return "generate_answer"


def _route_error(state: AgentState) -> str:
    if state.get("error"):
        return "generate_answer"
    return END


def build_graph() -> StateGraph:
    builder = StateGraph(AgentState)

    # Register nodes
    builder.add_node("classify_intent", classify_intent)
    builder.add_node("select_sources", select_sources)
    builder.add_node("validate_permissions", validate_permissions)
    builder.add_node("retrieve", retrieve)
    builder.add_node("plan", plan)
    builder.add_node("execute_tools", execute_tools)
    builder.add_node("generate_answer", generate_answer)
    builder.add_node("validate_citations", validate_citations)
    builder.add_node("log_audit", log_audit)

    # Entry point
    builder.set_entry_point("classify_intent")

    # Linear edges
    builder.add_edge("classify_intent", "select_sources")
    builder.add_edge("select_sources", "validate_permissions")
    builder.add_conditional_edges("validate_permissions", _route_after_permissions)
    builder.add_edge("retrieve", "plan")
    builder.add_edge("plan", "execute_tools")
    builder.add_conditional_edges("execute_tools", _route_after_execution)
    builder.add_edge("generate_answer", "validate_citations")
    builder.add_edge("validate_citations", "log_audit")
    builder.add_edge("log_audit", END)

    return builder


# Compiled graph with in-memory checkpointing (swap MemorySaver for SqliteSaver or PostgresSaver in prod)
checkpointer = MemorySaver()
graph = build_graph().compile(checkpointer=checkpointer)
