"""Composio SDK wrapper for OAuth connector management."""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

import httpx

from core.config import settings

log = logging.getLogger(__name__)
_BASE = "https://backend.composio.dev/api/v3.1"

# Maps backend source names to Composio toolkit slugs
TOOLKIT_SLUGS: dict[str, str] = {
    "gmail":            "gmail",
    "google_drive":     "googledrive",
    "google_calendar":  "googlecalendar",
    "slack":            "slack",
    "github":           "github",
    "jira":             "jira",
    "notion":           "notion",
    "confluence":       "confluence",
    "salesforce":       "salesforce",
    "hubspot":          "hubspot",
    "zendesk":          "zendesk",
    "microsoft_teams":  "microsoftteams",
    "onedrive":         "onedrive",
}

def _headers() -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "x-api-key": settings.composio_api_key,
    }


def _raise_for_composio(resp: httpx.Response) -> None:
    if resp.is_success:
        return
    try:
        data = resp.json()
    except ValueError:
        data = {"error": {"message": resp.text}}
    message = data.get("error", {}).get("message") if isinstance(data, dict) else None
    if resp.status_code == 401 and message and "invalid api key" in message.lower():
        message = (
            "Composio accepted COMPOSIO_API_KEY for read requests, but rejected this write request. "
            "If this is a scoped project key, grant Read and write access for Auth configs and "
            "Connected accounts, or set COMPOSIO_AUTH_CONFIG_IDS to an existing auth config ID."
        )
    raise RuntimeError(message or f"Composio request failed with status {resp.status_code}")


@lru_cache(maxsize=None)
def _get_or_create_auth_config(source: str) -> str:
    toolkit_slug = TOOLKIT_SLUGS.get(source)
    if not toolkit_slug:
        raise ValueError(f"'{source}' is not a supported Composio connector")

    configured_id = settings.composio_auth_config_ids.get(source) or settings.composio_auth_config_ids.get(toolkit_slug)
    if configured_id:
        return configured_id

    with httpx.Client(timeout=20) as client:
        list_resp = client.get(
            f"{_BASE}/auth_configs",
            headers=_headers(),
            params={"toolkit_slug": toolkit_slug, "is_composio_managed": "true", "limit": 100},
        )
        _raise_for_composio(list_resp)
        items = list_resp.json().get("items", [])
        if items:
            return items[0]["id"]

        create_resp = client.post(
            f"{_BASE}/auth_configs",
            headers=_headers(),
            json={
                "toolkit": {"slug": toolkit_slug},
                "auth_config": {"type": "use_composio_managed_auth"},
            },
        )
        _raise_for_composio(create_resp)
        return create_resp.json()["auth_config"]["id"]


def initiate_connection(user_id: str, source: str, callback_url: str) -> tuple[str, str]:
    """Start an OAuth flow via Composio.

    Returns ``(connection_id, redirect_url)`` — the redirect URL should be opened
    by the user to complete OAuth. The connection_id must be saved after the callback.
    """
    auth_config_id = _get_or_create_auth_config(source)
    with httpx.Client(timeout=20) as client:
        resp = client.post(
            f"{_BASE}/connected_accounts/link",
            headers=_headers(),
            json={
                "auth_config_id": auth_config_id,
                "user_id": user_id,
                "callback_url": callback_url,
            },
        )
        _raise_for_composio(resp)
        data = resp.json()
        return data.get("connected_account_id", ""), data["redirect_url"]


def get_token(connection_id: str) -> str | None:
    """Return a valid access token for the given Composio connection.

    Composio handles token refresh transparently — this always returns a fresh token.
    """
    try:
        with httpx.Client(timeout=20) as client:
            resp = client.get(f"{_BASE}/connected_accounts/{connection_id}", headers=_headers())
            _raise_for_composio(resp)
            data: dict[str, Any] = resp.json()
            credentials = (
                data.get("data")
                or data.get("state", {}).get("val")
                or data.get("params")
                or data.get("credentials")
                or {}
            )
            token = credentials.get("access_token")
            if isinstance(token, str) and token.upper() == "REDACTED":
                return None
            return token
    except Exception:
        log.exception("composio.get_token_error", connection_id=connection_id)
        return None


def execute_tool(connection_id: str, tool_slug: str, arguments: dict[str, Any]) -> dict[str, Any]:
    import os
    from pathlib import Path

    os.environ.setdefault("COMPOSIO_CACHE_DIR", str(Path(__file__).resolve().parents[1] / ".composio-cache"))
    from composio import Composio

    with httpx.Client(timeout=20) as client:
        resp = client.get(f"{_BASE}/connected_accounts/{connection_id}", headers=_headers())
        _raise_for_composio(resp)
        account_user_id = resp.json().get("user_id")

    result = Composio(api_key=settings.composio_api_key).client.tools.execute(
        tool_slug,
        arguments=arguments,
        connected_account_id=connection_id,
        user_id=account_user_id,
    )
    data = getattr(result, "data", None)
    return data if isinstance(data, dict) else {"result": data}


def delete_connection(connection_id: str) -> bool:
    try:
        with httpx.Client(timeout=20) as client:
            resp = client.delete(f"{_BASE}/connected_accounts/{connection_id}", headers=_headers())
            _raise_for_composio(resp)
        return True
    except Exception:
        log.exception("composio.delete_error", connection_id=connection_id)
        return False
