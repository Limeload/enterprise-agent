"""Thin wrapper around the Composio SDK for per-user OAuth connections.

Each connector source must have a corresponding Composio "auth config" created in the
Composio dashboard (app.composio.dev) ahead of time, and its id set in
`settings.composio_auth_config_ids`. Composio owns the OAuth app registration/secrets
for each toolkit, so we never store provider client secrets ourselves — only the
resulting connected-account id (and, where Composio exposes one, the access token).
"""
from __future__ import annotations

from functools import lru_cache

from composio import Composio

from core.config import settings


@lru_cache
def get_composio() -> Composio:
    return Composio(api_key=settings.composio_api_key)


def auth_config_id_for(source: str) -> str | None:
    return settings.composio_auth_config_ids.get(source)


def initiate_connection(user_id: str, source: str, callback_url: str):
    """Start a hosted OAuth flow. Returns the Composio ConnectionRequest (has `.id`, `.redirect_url`)."""
    auth_config_id = auth_config_id_for(source)
    if not auth_config_id:
        raise ValueError(f"No Composio auth_config_id configured for connector '{source}'")
    return get_composio().connected_accounts.link(
        user_id=user_id,
        auth_config_id=auth_config_id,
        callback_url=callback_url,
    )


def get_connection_status(connected_account_id: str):
    return get_composio().connected_accounts.get(connected_account_id)


def delete_connection(connected_account_id: str) -> None:
    get_composio().connected_accounts.delete(connected_account_id)
