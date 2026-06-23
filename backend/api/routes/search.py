"""GET/POST /search — direct vector search and connector search endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from api.deps import get_current_user
from connectors import get_connector, list_connectors
from core.security import User, check_source_permission
from db.vector_store import get_vector_store

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    query: str
    sources: list[str] | None = None
    limit: int = 10


class SearchResult(BaseModel):
    source: str
    title: str
    content: str
    url: str
    score: float
    metadata: dict


@router.post("", response_model=list[SearchResult])
async def search(
    req: SearchRequest,
    user: User = Depends(get_current_user),
) -> list[SearchResult]:
    """Search across specified connectors and the vector store."""
    sources = req.sources or list_connectors()
    allowed_sources = [s for s in sources if check_source_permission(user, s)]

    all_results: list[dict] = []

    for source in allowed_sources:
        connector = get_connector(source, user_id=user.user_id)
        if connector:
            docs = await connector.search(req.query, entities={}, limit=req.limit)
            all_results.extend(docs)

    # Also search the vector store
    vs = get_vector_store()
    vector_results = await vs.search(req.query, limit=req.limit)
    all_results.extend(vector_results)

    # Sort by score and deduplicate by doc_id
    seen: set[str] = set()
    deduped: list[dict] = []
    for doc in sorted(all_results, key=lambda d: d.get("score", 0), reverse=True):
        key = f"{doc.get('source')}:{doc.get('doc_id')}"
        if key not in seen:
            seen.add(key)
            deduped.append(doc)

    return [
        SearchResult(
            source=d.get("source", ""),
            title=d.get("title", ""),
            content=d.get("content", "")[:500],
            url=d.get("url", ""),
            score=d.get("score", 0),
            metadata=d.get("metadata", {}),
        )
        for d in deduped[: req.limit * 2]
    ]


@router.get("/connectors")
async def available_connectors(user: User = Depends(get_current_user)) -> dict:
    """List all connectors and which ones the current user can access."""
    all_sources = list_connectors()
    return {
        "available": all_sources,
        "accessible": [s for s in all_sources if check_source_permission(user, s)],
    }
