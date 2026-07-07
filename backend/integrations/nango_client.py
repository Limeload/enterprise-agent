"""Nango REST API client for OAuth token retrieval and connection management.

Nango is the OAuth infrastructure layer. BrainCache never stores access or
refresh tokens — only the Nango connection ID. Nango handles token refresh
transparently; every call to get_token returns a fresh, valid access token.
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from core.config import settings

log = logging.getLogger(__name__)

_BASE = "https://api.nango.dev"


def _auth_header() -> dict[str, str]:
    return {"Authorization": f"Bearer {settings.nango_secret_key}"}


# ---------------------------------------------------------------------------
# Provider config key mapping
# Maps BrainCache source name → Nango provider config key (set in Nango dashboard)
# ---------------------------------------------------------------------------
PROVIDER_CONFIG_KEYS: dict[str, str] = {
    "gmail":            "google-mail",
    "google_drive":     "google-drive",
    "google_calendar":  "google-calendar",
    "slack":            "slack",
    "github":           "github",
    "jira":             "jira",
    "notion":           "notion",
    "confluence":       "confluence",
    "salesforce":       "salesforce",
    "hubspot":          "hubspot",
    "zendesk":          "zendesk",
    "microsoft_teams":  "microsoft-teams",
    "onedrive":         "microsoft-onedrive",
}


def provider_config_key(source: str) -> str | None:
    return PROVIDER_CONFIG_KEYS.get(source)


async def get_token(source: str, connection_id: str) -> str | None:
    """Return a valid access token for the given connection.

    Nango refreshes the token automatically before returning it, so callers
    always receive a non-expired token without any extra logic.
    """
    config_key = provider_config_key(source)
    if not config_key:
        log.warning("nango.unknown_source", source=source)
        return None

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{_BASE}/connection/{connection_id}",
                params={"provider_config_key": config_key, "force_refresh": "true"},
                headers=_auth_header(),
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("credentials", {}).get("access_token")
            log.warning(
                "nango.get_token_failed",
                status=resp.status_code,
                source=source,
                connection_id=connection_id,
            )
    except Exception:
        log.exception("nango.get_token_error", source=source, connection_id=connection_id)
    return None


async def get_connection_metadata(source: str, connection_id: str) -> dict[str, Any]:
    """Return full connection metadata from Nango (credentials + provider account info)."""
    config_key = provider_config_key(source)
    if not config_key:
        return {}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{_BASE}/connection/{connection_id}",
                params={"provider_config_key": config_key},
                headers=_auth_header(),
            )
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        log.exception("nango.get_metadata_error", source=source, connection_id=connection_id)
    return {}


async def delete_connection(source: str, connection_id: str) -> bool:
    """Delete a Nango connection and revoke stored tokens."""
    config_key = provider_config_key(source)
    if not config_key:
        return False

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.delete(
                f"{_BASE}/connection/{connection_id}",
                params={"provider_config_key": config_key},
                headers=_auth_header(),
            )
            return resp.status_code in (200, 204)
    except Exception:
        log.exception("nango.delete_error", source=source, connection_id=connection_id)
    return False


async def list_provider_connections(source: str) -> list[dict[str, Any]]:
    """List all connections for a given provider config key."""
    config_key = provider_config_key(source)
    if not config_key:
        return []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{_BASE}/connection",
                params={"provider_config_key": config_key},
                headers=_auth_header(),
            )
            if resp.status_code == 200:
                return resp.json().get("connections", [])
    except Exception:
        log.exception("nango.list_connections_error", source=source)
    return []
