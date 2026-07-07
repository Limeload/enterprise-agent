"""Google Drive connector via Drive REST API v3."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector


class GoogleDriveConnector(BaseConnector):
    name = "google_drive"

    def __init__(self, token: str) -> None:
        self._token = token
        self._headers = {"Authorization": f"Bearer {self._token}"}
        self._base = "https://www.googleapis.com/drive/v3"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        return await self.search_files(query, limit=limit)

    async def search_files(self, query: str, limit: int = 10) -> list[dict]:
        drive_query = f"fullText contains '{query}' and trashed = false"
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/files",
                params={
                    "q": drive_query,
                    "pageSize": limit,
                    "fields": "files(id,name,mimeType,webViewLink,modifiedTime,owners)",
                },
            )
            if resp.status_code != 200:
                return []

            docs: list[dict] = []
            for f in resp.json().get("files", []):
                docs.append({
                    "source": "google_drive",
                    "doc_id": f["id"],
                    "title": f.get("name", "Untitled"),
                    "content": f"Type: {f.get('mimeType', '')}",
                    "url": f.get("webViewLink", ""),
                    "score": 0.75,
                    "metadata": {
                        "mime_type": f.get("mimeType", ""),
                        "modified_time": f.get("modifiedTime", ""),
                        "owners": [o.get("emailAddress", "") for o in f.get("owners", [])],
                    },
                })
            return docs

    async def list_folders(self, parent_id: str = "root") -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/files",
                params={
                    "q": f"mimeType = 'application/vnd.google-apps.folder' and '{parent_id}' in parents and trashed = false",
                    "fields": "files(id,name,webViewLink)",
                },
            )
            return resp.json().get("files", []) if resp.status_code == 200 else []

    async def download_document(self, file_id: str) -> bytes | None:
        """Export a Google Doc as plain text."""
        async with httpx.AsyncClient(headers=self._headers, timeout=30) as client:
            resp = await client.get(
                f"{self._base}/files/{file_id}/export",
                params={"mimeType": "text/plain"},
            )
            return resp.content if resp.status_code == 200 else None

    async def get_item(self, item_id: str) -> dict | None:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/files/{item_id}",
                params={"fields": "id,name,mimeType,webViewLink,modifiedTime"},
            )
            if resp.status_code != 200:
                return None
            f = resp.json()
            return {
                "source": "google_drive",
                "doc_id": f["id"],
                "title": f.get("name", "Untitled"),
                "content": "",
                "url": f.get("webViewLink", ""),
                "score": 1.0,
                "metadata": {"mime_type": f.get("mimeType", ""), "modified_time": f.get("modifiedTime", "")},
            }
