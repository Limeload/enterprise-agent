"""Zendesk connector via Zendesk REST API v2."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector


class ZendeskConnector(BaseConnector):
    name = "zendesk"

    def __init__(self, token: str, subdomain: str = "") -> None:
        self._token = token
        self._subdomain = subdomain
        self._base = f"https://{subdomain}.zendesk.com/api/v2" if subdomain else "https://api.zendesk.com/api/v2"
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=20) as client:
            resp = await client.get(
                f"{self._base}/search",
                params={"query": f"type:ticket {query}", "per_page": limit},
            )
            if resp.status_code != 200:
                return []

            docs: list[dict] = []
            for ticket in resp.json().get("results", []):
                docs.append(self._ticket_to_doc(ticket))
            return docs

    def _ticket_to_doc(self, ticket: dict) -> dict:
        return {
            "source": "zendesk",
            "doc_id": str(ticket.get("id", "")),
            "title": f"#{ticket.get('id', '')} — {ticket.get('subject', '')}",
            "content": ticket.get("description", ""),
            "url": f"{self._base.replace('/api/v2', '')}/agent/tickets/{ticket.get('id', '')}",
            "score": 0.75,
            "metadata": {
                "status": ticket.get("status", ""),
                "priority": ticket.get("priority", ""),
                "type": ticket.get("type", ""),
                "requester_id": ticket.get("requester_id"),
                "assignee_id": ticket.get("assignee_id"),
                "created_at": ticket.get("created_at", ""),
                "updated_at": ticket.get("updated_at", ""),
            },
        }

    async def get_ticket(self, ticket_id: str) -> dict | None:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/tickets/{ticket_id}")
            if resp.status_code != 200:
                return None
            return self._ticket_to_doc(resp.json().get("ticket", {}))

    async def list_tickets(self, status: str = "open", limit: int = 25) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/tickets",
                params={"status": status, "per_page": limit, "sort_order": "desc"},
            )
            if resp.status_code != 200:
                return []
            return [self._ticket_to_doc(t) for t in resp.json().get("tickets", [])]

    async def get_item(self, item_id: str) -> dict | None:
        return await self.get_ticket(item_id)
