"""GitHub connector — real implementation via GitHub REST API v3."""
from __future__ import annotations

from typing import Any

import httpx

from connectors.base import BaseConnector
from core.config import settings


class GitHubConnector(BaseConnector):
    name = "github"

    def __init__(self, token: str | None = None) -> None:
        self._token = token or settings.github_token
        self._org = settings.github_org
        self._headers = {
            "Authorization": f"Bearer {self._token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        self._base = "https://api.github.com"

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        results: list[dict] = []

        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            # Search issues/PRs
            scope = f"org:{self._org}" if self._org else ""
            resp = await client.get(
                f"{self._base}/search/issues",
                params={"q": f"{query} {scope}".strip(), "per_page": limit, "sort": "updated"},
            )
            if resp.status_code == 200:
                for item in resp.json().get("items", []):
                    results.append({
                        "source": "github",
                        "doc_id": str(item["id"]),
                        "title": item["title"],
                        "content": item.get("body") or "",
                        "url": item["html_url"],
                        "score": 0.85,
                        "metadata": {
                            "state": item["state"],
                            "type": "pull_request" if "pull_request" in item else "issue",
                            "number": item["number"],
                            "repo": item["repository_url"].split("/")[-1],
                            "created_at": item["created_at"],
                            "updated_at": item["updated_at"],
                        },
                    })

        return results[:limit]

    async def search_issues(self, query: str = "", repo: str = "", state: str = "open", limit: int = 10) -> dict:
        scope = f"repo:{self._org}/{repo}" if repo and self._org else ""
        q = f"{query} {scope} state:{state}".strip()

        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(
                f"{self._base}/search/issues",
                params={"q": q, "per_page": limit},
            )
            return resp.json() if resp.status_code == 200 else {"items": [], "error": resp.text}

    async def get_pr(self, repo: str, pr_number: int) -> dict:
        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.get(f"{self._base}/repos/{self._org}/{repo}/pulls/{pr_number}")
            return resp.json() if resp.status_code == 200 else {}

    async def create_issue(self, repo: str, title: str, body: str = "", labels: list[str] | None = None) -> dict:
        payload: dict[str, Any] = {"title": title, "body": body}
        if labels:
            payload["labels"] = labels

        async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
            resp = await client.post(
                f"{self._base}/repos/{self._org}/{repo}/issues",
                json=payload,
            )
            return resp.json() if resp.status_code == 201 else {"error": resp.text}

    async def get_item(self, item_id: str) -> dict | None:
        # item_id format: "owner/repo/issues/123"
        parts = item_id.split("/")
        if len(parts) == 4:
            owner, repo, _, number = parts
            async with httpx.AsyncClient(headers=self._headers, timeout=15) as client:
                resp = await client.get(f"{self._base}/repos/{owner}/{repo}/issues/{number}")
                return resp.json() if resp.status_code == 200 else None
        return None
