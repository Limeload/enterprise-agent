"""LangSmith tracing configuration."""
from __future__ import annotations

import os
from core.config import settings


def configure_langsmith() -> None:
    """Set env vars that LangChain/LangGraph read automatically for tracing."""
    os.environ["LANGCHAIN_API_KEY"] = settings.langchain_api_key
    os.environ["LANGCHAIN_TRACING_V2"] = str(settings.langchain_tracing_v2).lower()
    os.environ["LANGCHAIN_PROJECT"] = settings.langchain_project
    os.environ["LANGCHAIN_ENDPOINT"] = settings.langchain_endpoint


def get_run_url(run_id: str) -> str:
    return f"https://smith.langchain.com/runs/{run_id}"
