"""Gmail connector via Gmail REST API v1."""
from __future__ import annotations

import base64
import email as email_lib
from html import unescape
from typing import Any

import httpx

from connectors.base import BaseConnector


class GmailConnector(BaseConnector):
    name = "gmail"

    def __init__(self, token: str | None = None, composio_connection_id: str | None = None) -> None:
        self._token = token
        self._composio_connection_id = composio_connection_id
        self._headers = {"Authorization": f"Bearer {self._token}"} if self._token else {}
        self._base = "https://gmail.googleapis.com/gmail/v1/users/me"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        return await self.search_emails(query, limit=limit)

    def _gmail_query(self, query: str) -> str:
        lowered = query.lower()
        if any(term in lowered for term in ("rejection", "rejected", "reject", "application")):
            return 'rejection OR rejected OR unfortunately OR "not selected" OR "not moving forward"'
        return query

    async def search_emails(self, query: str, limit: int = 10) -> list[dict]:
        gmail_query = self._gmail_query(query)
        if self._composio_connection_id and not self._token:
            return await self._search_emails_via_composio(gmail_query, limit=limit)

        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/messages",
                params={"q": gmail_query, "maxResults": limit},
            )
            if resp.status_code != 200:
                return []

            data = resp.json()
            message_ids = [m["id"] for m in data.get("messages", [])]
            estimated_count = data.get("resultSizeEstimate", len(message_ids))
            docs: list[dict] = [{
                "source": "gmail",
                "doc_id": f"gmail-search:{gmail_query}",
                "title": "Gmail search summary",
                "content": (
                    f'Gmail search query: {gmail_query}\n'
                    f"Estimated matching email count: {estimated_count}\n"
                    f"Fetched sample count: {len(message_ids[:limit])}"
                ),
                "url": "https://mail.google.com/mail/u/0/#search/" + gmail_query.replace(" ", "+"),
                "score": 1.0,
                "metadata": {
                    "query": gmail_query,
                    "estimated_count": estimated_count,
                    "sample_count": len(message_ids[:limit]),
                },
            }]
            for msg_id in message_ids[:limit]:
                msg = await self._get_message_detail(client, msg_id)
                if msg:
                    docs.append(msg)
            return docs

    async def _search_emails_via_composio(self, gmail_query: str, limit: int = 10) -> list[dict]:
        from integrations.composio_client import execute_tool

        data = execute_tool(
            self._composio_connection_id or "",
            "GMAIL_FETCH_EMAILS",
            {
                "query": gmail_query,
                "max_results": min(max(limit, 1), 100),
                "user_id": "me",
                "verbose": False,
                "include_payload": False,
            },
        )
        messages = data.get("messages", []) if isinstance(data, dict) else []
        estimated_count = data.get("resultSizeEstimate")
        next_page_token = data.get("nextPageToken")
        docs: list[dict] = [{
            "source": "gmail",
            "doc_id": f"gmail-search:{gmail_query}",
            "title": "Gmail search summary",
            "content": (
                f"Composio Gmail search query: {gmail_query}\n"
                f"Estimated matching message count from Gmail: {estimated_count if estimated_count is not None else 'unknown'}\n"
                f"Fetched sample count: {len(messages)}\n"
                f"More pages available: {bool(next_page_token)}\n"
                "Note: the estimate is for messages matching rejection-related search terms; sampled messages may include false positives."
            ),
            "url": "https://mail.google.com/mail/u/0/#search/" + gmail_query.replace(" ", "+"),
            "score": 1.0,
            "metadata": {
                "query": gmail_query,
                "estimated_count": estimated_count,
                "fetched_count": len(messages),
                "has_more": bool(next_page_token),
            },
        }]
        for item in messages[:limit]:
            preview = item.get("preview") or {}
            body = unescape(preview.get("body") or item.get("messageText") or "")
            subject = unescape(preview.get("subject") or item.get("subject") or "(no subject)")
            msg_id = item.get("messageId") or item.get("id") or subject
            docs.append({
                "source": "gmail",
                "doc_id": msg_id,
                "title": subject,
                "content": body,
                "url": f"https://mail.google.com/mail/u/0/#inbox/{msg_id}",
                "score": 0.85,
                "metadata": {
                    "from": item.get("sender", ""),
                    "to": item.get("to", ""),
                    "date": item.get("messageTimestamp", ""),
                    "thread_id": item.get("threadId", ""),
                },
            })
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
