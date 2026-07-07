"""HubSpot connector — real implementation via HubSpot API v3."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector


class HubSpotConnector(BaseConnector):
    name = "hubspot"

    def __init__(self, token: str) -> None:
        self._token = token
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }
        self._base = "https://api.hubapi.com"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        docs: list[dict] = []

        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            # Search contacts
            resp = await client.post(
                f"{self._base}/crm/v3/objects/contacts/search",
                json={
                    "query": query,
                    "limit": limit,
                    "properties": ["firstname", "lastname", "email", "company", "hs_lead_status"],
                },
            )
            if resp.status_code == 200:
                for item in resp.json().get("results", []):
                    props = item.get("properties", {})
                    name = f"{props.get('firstname', '')} {props.get('lastname', '')}".strip()
                    docs.append({
                        "source": "hubspot",
                        "doc_id": item["id"],
                        "title": f"Contact: {name or 'Unknown'}",
                        "content": f"Email: {props.get('email', '')} | Company: {props.get('company', '')} | Status: {props.get('hs_lead_status', '')}",
                        "url": f"https://app.hubspot.com/contacts/{item['id']}",
                        "score": 0.8,
                        "metadata": {"type": "contact", "props": props},
                    })

        return docs[:limit]

    async def search_contacts(self, query: str = "", limit: int = 10) -> dict:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.post(
                f"{self._base}/crm/v3/objects/contacts/search",
                json={"query": query, "limit": limit, "properties": ["firstname", "lastname", "email", "company", "phone"]},
            )
            return resp.json() if resp.status_code == 200 else {"results": [], "error": resp.text}

    async def get_deal(self, deal_id: str) -> dict:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/crm/v3/objects/deals/{deal_id}",
                params={"properties": "dealname,amount,dealstage,closedate,hubspot_owner_id"},
            )
            return resp.json() if resp.status_code == 200 else {}

    async def list_deals(self, limit: int = 10) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/crm/v3/objects/deals",
                params={"limit": limit, "properties": "dealname,amount,dealstage,closedate"},
            )
            data = resp.json()
            return data.get("results", []) if resp.status_code == 200 else []

    async def get_item(self, item_id: str) -> dict | None:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/crm/v3/objects/contacts/{item_id}")
            return resp.json() if resp.status_code == 200 else None
