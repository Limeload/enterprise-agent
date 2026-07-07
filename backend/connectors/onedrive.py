"""OneDrive connector via Microsoft Graph API v1."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector


class OneDriveConnector(BaseConnector):
    name = "onedrive"

    def __init__(self, token: str) -> None:
        self._token = token
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Accept": "application/json",
        }
        self._base = "https://graph.microsoft.com/v1.0/me/drive"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        return await self.search_files(query, limit=limit)

    async def search_files(self, query: str, limit: int = 10) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/search(q='{query}')",
                params={"$top": limit, "$select": "id,name,webUrl,lastModifiedDateTime,file,createdBy"},
            )
            if resp.status_code != 200:
                return []

            docs: list[dict] = []
            for item in resp.json().get("value", []):
                docs.append(self._item_to_doc(item))
            return docs

    def _item_to_doc(self, item: dict) -> dict:
        return {
            "source": "onedrive",
            "doc_id": item.get("id", ""),
            "title": item.get("name", "Untitled"),
            "content": f"File type: {item.get('file', {}).get('mimeType', 'unknown')}",
            "url": item.get("webUrl", ""),
            "score": 0.75,
            "metadata": {
                "mime_type": item.get("file", {}).get("mimeType", ""),
                "modified_at": item.get("lastModifiedDateTime", ""),
                "created_by": item.get("createdBy", {}).get("user", {}).get("displayName", ""),
            },
        }

    async def list_folders(self, folder_id: str = "root") -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/items/{folder_id}/children",
                params={"$filter": "folder ne null", "$select": "id,name,webUrl"},
            )
            return resp.json().get("value", []) if resp.status_code == 200 else []

    async def download_file(self, file_id: str) -> bytes | None:
        async with httpx.AsyncClient(headers=self._headers, timeout=30, follow_redirects=True) as client:
            resp = await client.get(f"{self._base}/items/{file_id}/content")
            return resp.content if resp.status_code == 200 else None

    async def get_item(self, item_id: str) -> dict | None:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/items/{item_id}",
                params={"$select": "id,name,webUrl,lastModifiedDateTime,file"},
            )
            if resp.status_code != 200:
                return None
            return self._item_to_doc(resp.json())
