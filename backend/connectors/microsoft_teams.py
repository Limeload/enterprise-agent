"""Microsoft Teams connector via Microsoft Graph API v1."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector


class MicrosoftTeamsConnector(BaseConnector):
    name = "microsoft_teams"

    def __init__(self, token: str) -> None:
        self._token = token
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }
        self._base = "https://graph.microsoft.com/v1.0"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        return await self.search_messages(query, limit=limit)

    async def search_messages(self, query: str, limit: int = 10) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=20) as client:
            resp = await client.post(
                f"{self._base}/search/query",
                json={
                    "requests": [{
                        "entityTypes": ["chatMessage"],
                        "query": {"queryString": query},
                        "size": limit,
                    }]
                },
            )
            if resp.status_code != 200:
                return []

            docs: list[dict] = []
            for result in resp.json().get("value", []):
                for hit in result.get("hitsContainers", []):
                    for h in hit.get("hits", []):
                        resource = h.get("resource", {})
                        docs.append({
                            "source": "microsoft_teams",
                            "doc_id": resource.get("id", ""),
                            "title": f"Teams: {resource.get('channelIdentity', {}).get('channelId', '')}",
                            "content": resource.get("body", {}).get("content", ""),
                            "url": resource.get("webUrl", ""),
                            "score": 0.75,
                            "metadata": {
                                "from": resource.get("from", {}).get("user", {}).get("displayName", ""),
                                "created_at": resource.get("createdDateTime", ""),
                                "team_id": resource.get("channelIdentity", {}).get("teamId", ""),
                            },
                        })
            return docs[:limit]

    async def list_teams(self) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/me/joinedTeams")
            return resp.json().get("value", []) if resp.status_code == 200 else []

    async def list_channels(self, team_id: str) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/teams/{team_id}/channels")
            return resp.json().get("value", []) if resp.status_code == 200 else []

    async def get_channel_messages(self, team_id: str, channel_id: str, limit: int = 20) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/teams/{team_id}/channels/{channel_id}/messages",
                params={"$top": limit},
            )
            return resp.json().get("value", []) if resp.status_code == 200 else []

    async def post_message(self, team_id: str, channel_id: str, content: str) -> dict:
        """Post a message to a Teams channel. MUST only be called after explicit human approval."""
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.post(
                f"{self._base}/teams/{team_id}/channels/{channel_id}/messages",
                json={"body": {"content": content}},
            )
            return resp.json() if resp.status_code == 201 else {"error": resp.text}

    async def get_item(self, item_id: str) -> dict | None:
        return None
