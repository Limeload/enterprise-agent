"""Jira connector via Jira REST API v3 (Atlassian Cloud)."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector


class JiraConnector(BaseConnector):
    name = "jira"

    def __init__(self, token: str, cloud_id: str = "", base_url: str = "") -> None:
        self._token = token
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        # Support both cloud_id-based and direct base_url approaches
        if cloud_id:
            self._base = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"
        elif base_url:
            self._base = f"{base_url.rstrip('/')}/rest/api/3"
        else:
            self._base = "https://api.atlassian.com/ex/jira/rest/api/3"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        jql = f'text ~ "{query}" ORDER BY updated DESC'
        return await self.search_tickets(jql=jql, limit=limit)

    async def search_tickets(self, jql: str = "", query: str = "", limit: int = 10) -> list[dict]:
        if not jql and query:
            jql = f'text ~ "{query}" ORDER BY updated DESC'
        async with httpx.AsyncClient(headers=self._headers, timeout=20) as client:
            resp = await client.post(
                f"{self._base}/search",
                json={
                    "jql": jql,
                    "maxResults": limit,
                    "fields": ["summary", "description", "status", "assignee", "priority", "issuetype", "project"],
                },
            )
            if resp.status_code != 200:
                return []

            docs: list[dict] = []
            for issue in resp.json().get("issues", []):
                docs.append(self._issue_to_doc(issue))
            return docs

    def _issue_to_doc(self, issue: dict) -> dict:
        fields = issue.get("fields", {})
        description = fields.get("description") or {}
        desc_text = ""
        if isinstance(description, dict):
            for block in description.get("content", []):
                for item in block.get("content", []):
                    desc_text += item.get("text", "") + " "

        return {
            "source": "jira",
            "doc_id": issue["id"],
            "title": f"{issue.get('key', '')} — {fields.get('summary', '')}",
            "content": desc_text.strip(),
            "url": f"https://your-domain.atlassian.net/browse/{issue.get('key', '')}",
            "score": 0.8,
            "metadata": {
                "key": issue.get("key", ""),
                "status": (fields.get("status") or {}).get("name", ""),
                "priority": (fields.get("priority") or {}).get("name", ""),
                "issue_type": (fields.get("issuetype") or {}).get("name", ""),
                "project": (fields.get("project") or {}).get("name", ""),
                "assignee": ((fields.get("assignee") or {}).get("displayName", "")),
            },
        }

    async def get_ticket(self, issue_key: str) -> dict:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/issue/{issue_key}")
            if resp.status_code != 200:
                return {}
            return self._issue_to_doc(resp.json())

    async def create_ticket(
        self,
        project_key: str,
        summary: str,
        description: str = "",
        issue_type: str = "Task",
        priority: str = "Medium",
    ) -> dict:
        """Create a Jira ticket. MUST only be called after explicit human approval."""
        payload = {
            "fields": {
                "project": {"key": project_key},
                "summary": summary,
                "issuetype": {"name": issue_type},
                "priority": {"name": priority},
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}],
                },
            }
        }
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.post(f"{self._base}/issue", json=payload)
            return resp.json() if resp.status_code == 201 else {"error": resp.text}

    async def update_ticket(self, issue_key: str, fields: dict[str, Any]) -> dict:
        """Update a Jira ticket. MUST only be called after explicit human approval."""
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.put(f"{self._base}/issue/{issue_key}", json={"fields": fields})
            return {"updated": resp.status_code == 204} if resp.status_code == 204 else {"error": resp.text}

    async def get_item(self, item_id: str) -> dict | None:
        result = await self.get_ticket(item_id)
        return result or None
