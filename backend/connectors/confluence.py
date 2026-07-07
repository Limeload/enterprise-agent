"""Confluence connector via Confluence REST API v2 (Atlassian Cloud)."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector


class ConfluenceConnector(BaseConnector):
    name = "confluence"

    def __init__(self, token: str, cloud_id: str = "", base_url: str = "") -> None:
        self._token = token
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Accept": "application/json",
        }
        if cloud_id:
            self._base = f"https://api.atlassian.com/ex/confluence/{cloud_id}/wiki/api/v2"
        elif base_url:
            self._base = f"{base_url.rstrip('/')}/wiki/api/v2"
        else:
            self._base = "https://api.atlassian.com/ex/confluence/wiki/api/v2"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=20) as client:
            resp = await client.get(
                f"{self._base}/pages",
                params={"title": query, "limit": limit, "body-format": "storage"},
            )
            if resp.status_code != 200:
                return []

            docs: list[dict] = []
            for page in resp.json().get("results", []):
                docs.append(self._page_to_doc(page))
            return docs

    def _page_to_doc(self, page: dict) -> dict:
        body = page.get("body", {})
        content = body.get("storage", {}).get("value", "") if body else ""
        import re
        plain = re.sub(r"<[^>]+>", " ", content).strip()[:500]
        return {
            "source": "confluence",
            "doc_id": page.get("id", ""),
            "title": page.get("title", "Untitled"),
            "content": plain,
            "url": f"https://your-domain.atlassian.net/wiki{page.get('_links', {}).get('webui', '')}",
            "score": 0.75,
            "metadata": {
                "space": page.get("spaceId", ""),
                "version": (page.get("version") or {}).get("number", 1),
                "created_at": page.get("createdAt", ""),
            },
        }

    async def get_page(self, page_id: str) -> dict | None:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/pages/{page_id}",
                params={"body-format": "storage"},
            )
            if resp.status_code != 200:
                return None
            return self._page_to_doc(resp.json())

    async def list_spaces(self, limit: int = 25) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/spaces", params={"limit": limit})
            return resp.json().get("results", []) if resp.status_code == 200 else []

    async def get_item(self, item_id: str) -> dict | None:
        return await self.get_page(item_id)
