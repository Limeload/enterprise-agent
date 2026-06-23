"""Slack connector — real implementation via Slack Web API."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector
from core.config import settings


class SlackConnector(BaseConnector):
    name = "slack"

    def __init__(self) -> None:
        self._token = settings.slack_bot_token
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json; charset=utf-8",
        }
        self._base = "https://slack.com/api"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/search.messages",
                params={"query": query, "count": limit, "sort": "timestamp", "sort_dir": "desc"},
            )
            data = resp.json()
            if not data.get("ok"):
                return []

            messages = data.get("messages", {}).get("matches", [])
            docs: list[dict] = []
            for msg in messages:
                docs.append({
                    "source": "slack",
                    "doc_id": f"{msg.get('channel', {}).get('id', '')}-{msg.get('ts', '')}",
                    "title": f"#{msg.get('channel', {}).get('name', 'unknown')} — {msg.get('username', 'unknown')}",
                    "content": msg.get("text", ""),
                    "url": msg.get("permalink", ""),
                    "score": 0.75,
                    "metadata": {
                        "channel": msg.get("channel", {}).get("name", ""),
                        "user": msg.get("username", ""),
                        "ts": msg.get("ts", ""),
                    },
                })
            return docs

    async def post_message(self, channel: str, text: str, thread_ts: str | None = None) -> dict:
        payload: dict[str, Any] = {"channel": channel, "text": text}
        if thread_ts:
            payload["thread_ts"] = thread_ts

        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.post(f"{self._base}/chat.postMessage", json=payload)
            return resp.json()

    async def list_channels(self, limit: int = 100) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/conversations.list",
                params={"limit": limit, "exclude_archived": True, "types": "public_channel"},
            )
            data = resp.json()
            return data.get("channels", []) if data.get("ok") else []

    async def get_channel_history(self, channel: str, limit: int = 50) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/conversations.history",
                params={"channel": channel, "limit": limit},
            )
            data = resp.json()
            return data.get("messages", []) if data.get("ok") else []
