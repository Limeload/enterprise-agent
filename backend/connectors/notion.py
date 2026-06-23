"""Notion connector — real implementation via Notion API v1."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector
from core.config import settings


class NotionConnector(BaseConnector):
    name = "notion"

    def __init__(self, token: str | None = None) -> None:
        self._key = token or settings.notion_api_key
        self._headers = {
            "Authorization": f"Bearer {self._key}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        }
        self._base = "https://api.notion.com/v1"

    def _extract_text(self, rich_text: list[dict]) -> str:
        return "".join(block.get("plain_text", "") for block in rich_text)

    def _page_to_doc(self, page: dict) -> dict:
        props = page.get("properties", {})
        title = ""
        for prop in props.values():
            if prop.get("type") == "title":
                title = self._extract_text(prop.get("title", []))
                break

        return {
            "source": "notion",
            "doc_id": page["id"],
            "title": title or "Untitled",
            "content": "",   # populated separately via blocks API
            "url": page.get("url", ""),
            "score": 0.8,
            "metadata": {
                "created_time": page.get("created_time", ""),
                "last_edited_time": page.get("last_edited_time", ""),
                "archived": page.get("archived", False),
            },
        }

    async def _get_page_content(self, client: httpx.AsyncClient, page_id: str) -> str:
        resp = await client.get(f"{self._base}/blocks/{page_id}/children", params={"page_size": 20})
        if resp.status_code != 200:
            return ""

        text_parts: list[str] = []
        for block in resp.json().get("results", []):
            btype = block.get("type", "")
            block_data = block.get(btype, {})
            rich = block_data.get("rich_text", [])
            text_parts.append(self._extract_text(rich))
        return " ".join(text_parts)

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=20) as client:
            resp = await client.post(
                f"{self._base}/search",
                json={"query": query, "page_size": limit, "filter": {"value": "page", "property": "object"}},
            )
            if resp.status_code != 200:
                return []

            pages = resp.json().get("results", [])
            docs: list[dict] = []
            for page in pages:
                doc = self._page_to_doc(page)
                doc["content"] = await self._get_page_content(client, page["id"])
                docs.append(doc)

            return docs

    async def get_page(self, page_id: str) -> dict:
        async with httpx.AsyncClient(headers=self._headers, timeout=20) as client:
            resp = await client.get(f"{self._base}/pages/{page_id}")
            if resp.status_code != 200:
                return {}
            page = resp.json()
            doc = self._page_to_doc(page)
            doc["content"] = await self._get_page_content(client, page_id)
            return doc

    async def get_item(self, item_id: str) -> dict | None:
        result = await self.get_page(item_id)
        return result or None
