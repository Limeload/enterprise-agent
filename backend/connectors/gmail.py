"""Gmail connector via Gmail REST API v1."""
from __future__ import annotations

import base64
import email as email_lib
from typing import Any

import httpx

from connectors.base import BaseConnector


class GmailConnector(BaseConnector):
    name = "gmail"

    def __init__(self, token: str) -> None:
        self._token = token
        self._headers = {"Authorization": f"Bearer {self._token}"}
        self._base = "https://gmail.googleapis.com/gmail/v1/users/me"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        return await self.search_emails(query, limit=limit)

    async def search_emails(self, query: str, limit: int = 10) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/messages",
                params={"q": query, "maxResults": limit},
            )
            if resp.status_code != 200:
                return []

            message_ids = [m["id"] for m in resp.json().get("messages", [])]
            docs: list[dict] = []
            for msg_id in message_ids[:limit]:
                msg = await self._get_message_detail(client, msg_id)
                if msg:
                    docs.append(msg)
            return docs

    async def _get_message_detail(self, client: httpx.AsyncClient, msg_id: str) -> dict | None:
        resp = await client.get(
            f"{self._base}/messages/{msg_id}",
            params={"format": "metadata", "metadataHeaders": ["Subject", "From", "Date", "To"]},
        )
        if resp.status_code != 200:
            return None

        data = resp.json()
        headers = {h["name"]: h["value"] for h in data.get("payload", {}).get("headers", [])}
        snippet = data.get("snippet", "")
        return {
            "source": "gmail",
            "doc_id": msg_id,
            "title": headers.get("Subject", "(no subject)"),
            "content": snippet,
            "url": f"https://mail.google.com/mail/u/0/#inbox/{msg_id}",
            "score": 0.8,
            "metadata": {
                "from": headers.get("From", ""),
                "to": headers.get("To", ""),
                "date": headers.get("Date", ""),
                "thread_id": data.get("threadId", ""),
            },
        }

    async def get_email(self, msg_id: str) -> dict | None:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            return await self._get_message_detail(client, msg_id)

    async def list_threads(self, query: str = "", limit: int = 10) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/threads",
                params={"q": query, "maxResults": limit},
            )
            if resp.status_code != 200:
                return []
            return resp.json().get("threads", [])

    async def draft_email(self, to: str, subject: str, body: str) -> dict:
        """Create a draft — does NOT send without explicit human approval."""
        raw_msg = f"To: {to}\r\nSubject: {subject}\r\n\r\n{body}"
        encoded = base64.urlsafe_b64encode(raw_msg.encode()).decode()
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.post(
                f"{self._base}/drafts",
                json={"message": {"raw": encoded}},
            )
            return resp.json() if resp.status_code in (200, 201) else {"error": resp.text}

    async def send_email(self, to: str, subject: str, body: str) -> dict:
        """Send an email. MUST only be called after explicit human approval."""
        raw_msg = f"To: {to}\r\nSubject: {subject}\r\n\r\n{body}"
        encoded = base64.urlsafe_b64encode(raw_msg.encode()).decode()
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.post(
                f"{self._base}/messages/send",
                json={"raw": encoded},
            )
            return resp.json() if resp.status_code in (200, 201) else {"error": resp.text}

    async def get_item(self, item_id: str) -> dict | None:
        return await self.get_email(item_id)
