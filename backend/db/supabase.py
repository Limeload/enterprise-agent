"""Supabase client singleton — shared across the app."""
from __future__ import annotations

from supabase import create_client, Client

from core.config import settings

_client: Client | None = None


def is_supabase_configured() -> bool:
    url = settings.supabase_url or ""
    key = settings.supabase_service_role_key or ""
    return bool(url and not url.startswith("https://placeholder") and key)


def get_supabase() -> Client | None:
    if not is_supabase_configured():
        return None
    global _client
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client


# ---------------------------------------------------------------------------
# Schema helpers (run once to bootstrap the Supabase database)
# ---------------------------------------------------------------------------

BOOTSTRAP_SQL = """
-- Enable pgvector extension
create extension if not exists vector;

-- Audit logs table
create table if not exists audit_logs (
    event_id        uuid primary key,
    timestamp       timestamptz not null,
    user_id         text not null,
    session_id      text not null,
    action          text not null,
    query           text,
    sources_accessed text[],
    result_summary  text,
    tool_calls      jsonb,
    approved_by_human boolean default false,
    metadata        jsonb,
    created_at      timestamptz default now()
);

-- Vector document store for RAG
create table if not exists documents (
    id              uuid primary key default gen_random_uuid(),
    source          text not null,
    doc_id          text not null,
    title           text,
    content         text,
    url             text,
    embedding       vector(1536),
    metadata        jsonb,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now(),
    unique(source, doc_id)
);

-- HNSW index for fast ANN search
create index if not exists documents_embedding_idx
    on documents using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);

-- Agent memory (per user / session)
create table if not exists agent_memory (
    id              uuid primary key default gen_random_uuid(),
    user_id         text not null,
    session_id      text,
    memory_type     text not null,   -- 'episodic' | 'semantic' | 'preference'
    content         text not null,
    embedding       vector(1536),
    metadata        jsonb,
    created_at      timestamptz default now()
);

-- Users table (minimal — augment with your IdP fields)
create table if not exists users (
    id          uuid primary key default gen_random_uuid(),
    user_id     text unique not null,
    email       text unique not null,
    role        text not null default 'viewer',
    department  text,
    created_at  timestamptz default now()
);

-- Per-user connector connections (OAuth via Composio)
create table if not exists user_connections (
    id                      uuid primary key default gen_random_uuid(),
    user_id                 text not null,
    source                  text not null,
    status                  text not null default 'pending',  -- 'pending' | 'connected' | 'error'
    composio_connection_id  text,
    encrypted_credential    text,
    metadata                jsonb,
    created_at              timestamptz default now(),
    updated_at              timestamptz default now(),
    unique(user_id, source)
);
"""
