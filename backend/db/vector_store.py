"""pgvector-backed document store for RAG retrieval."""
from __future__ import annotations

import json
from typing import Any

import httpx

from core.config import settings
from db.supabase import get_supabase


class VectorStore:
    """Embed documents and run ANN search using Supabase pgvector."""

    def __init__(self, embed_model: str = "text-embedding-3-small") -> None:
        self._embed_model = embed_model
        self._openai_key = settings.openai_api_key

    async def _embed(self, text: str) -> list[float]:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {self._openai_key}"},
                json={"model": self._embed_model, "input": text[:8191]},
            )
            resp.raise_for_status()
            return resp.json()["data"][0]["embedding"]

    async def upsert(self, docs: list[dict[str, Any]]) -> None:
        """Embed and upsert documents into the vector store."""
        db = get_supabase()
        for doc in docs:
            embedding = await self._embed(doc.get("content", "")[:8191])
            db.table("documents").upsert({
                "source":    doc.get("source", ""),
                "doc_id":    doc.get("doc_id", ""),
                "title":     doc.get("title", ""),
                "content":   doc.get("content", ""),
                "url":       doc.get("url", ""),
                "embedding": embedding,
                "metadata":  doc.get("metadata", {}),
            }).execute()

    async def search(self, query: str, limit: int = 10, source_filter: str | None = None) -> list[dict]:
        """ANN search against the pgvector index."""
        embedding = await self._embed(query)
        db = get_supabase()

        # Call a Postgres function for vector similarity search
        params: dict[str, Any] = {
            "query_embedding": embedding,
            "match_count": limit,
        }
        if source_filter:
            params["source_filter"] = source_filter

        result = db.rpc("match_documents", params).execute()
        rows = result.data or []

        return [
            {
                "source":   r.get("source", "vector"),
                "doc_id":   r.get("doc_id", ""),
                "title":    r.get("title", ""),
                "content":  r.get("content", ""),
                "url":      r.get("url", ""),
                "score":    r.get("similarity", 0),
                "metadata": r.get("metadata", {}),
            }
            for r in rows
        ]


# Supabase RPC function to register (add to your Supabase SQL editor):
MATCH_DOCUMENTS_SQL = """
create or replace function match_documents(
  query_embedding vector(1536),
  match_count     int,
  source_filter   text default null
)
returns table (
  source text, doc_id text, title text, content text,
  url text, metadata jsonb, similarity float
)
language sql stable as $$
  select source, doc_id, title, content, url, metadata,
         1 - (embedding <=> query_embedding) as similarity
  from documents
  where (source_filter is null or source = source_filter)
  order by embedding <=> query_embedding
  limit match_count;
$$;
"""

_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _store
    if _store is None:
        _store = VectorStore()
    return _store
