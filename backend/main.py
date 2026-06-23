"""FastAPI application entry point."""
from __future__ import annotations

import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from observability.langsmith import configure_langsmith
from observability.opentelemetry import configure_otel
from api.routes.chat import router as chat_router
from api.routes.search import router as search_router
from api.routes.actions import router as actions_router

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)

log = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_langsmith()
    configure_otel(app)
    log.info("enterprise_agent_started", env=settings.app_env, model=settings.llm_model)
    yield
    log.info("enterprise_agent_shutdown")


app = FastAPI(
    title="Enterprise Knowledge & Action Agent",
    description="AI-powered enterprise assistant with multi-agent orchestration, RAG, and 30+ SaaS connectors.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(actions_router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "env": settings.app_env, "model": settings.llm_model}


@app.get("/")
async def root() -> dict:
    return {
        "name": "Enterprise Knowledge & Action Agent",
        "docs": "/docs",
        "health": "/health",
    }
