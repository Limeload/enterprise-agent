"""Salesforce connector via Salesforce REST API v59."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector


class SalesforceConnector(BaseConnector):
    name = "salesforce"

    def __init__(self, token: str, instance_url: str = "https://login.salesforce.com") -> None:
        self._token = token
        self._instance_url = instance_url.rstrip("/")
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }
        self._api = f"{self._instance_url}/services/data/v59.0"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        sosl = f"FIND {{{query}}} IN ALL FIELDS RETURNING Account(Id, Name, Industry, Website), Contact(Id, Name, Email, Account.Name) LIMIT {limit}"
        async with httpx.AsyncClient(headers=self._headers, timeout=20) as client:
            resp = await client.get(f"{self._api}/search", params={"q": sosl})
            if resp.status_code != 200:
                return []

            docs: list[dict] = []
            for record_type, records in resp.json().get("searchRecords", {}).items():
                for rec in records:
                    docs.append({
                        "source": "salesforce",
                        "doc_id": rec.get("Id", ""),
                        "title": f"{record_type}: {rec.get('Name', '')}",
                        "content": str(rec),
                        "url": f"{self._instance_url}/{rec.get('Id', '')}",
                        "score": 0.8,
                        "metadata": {"type": record_type, "record": rec},
                    })
            return docs[:limit]

    async def query(self, soql: str) -> list[dict]:
        async with httpx.AsyncClient(headers=self._headers, timeout=20) as client:
            resp = await client.get(f"{self._api}/query", params={"q": soql})
            if resp.status_code != 200:
                return []
            return resp.json().get("records", [])

    async def get_account(self, account_id: str) -> dict:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._api}/sobjects/Account/{account_id}")
            return resp.json() if resp.status_code == 200 else {}

    async def get_opportunity(self, opportunity_id: str) -> dict:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._api}/sobjects/Opportunity/{opportunity_id}")
            return resp.json() if resp.status_code == 200 else {}

    async def list_opportunities(self, limit: int = 10) -> list[dict]:
        soql = f"SELECT Id, Name, Amount, StageName, CloseDate, AccountId FROM Opportunity ORDER BY LastModifiedDate DESC LIMIT {limit}"
        return await self.query(soql)

    async def get_item(self, item_id: str) -> dict | None:
        result = await self.get_account(item_id)
        return result or None
