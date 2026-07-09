"""Connector management API — status, OAuth initiation, disconnect."""
from __future__ import annotations

import logging
import re
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from api.deps import get_current_user
from connectors import list_connectors
from core.config import settings
from core.security import User, check_source_permission
from integrations import composio_client

log = logging.getLogger(__name__)
router = APIRouter(prefix="/connectors", tags=["connectors"])

CALLBACK_URL = f"{settings.frontend_url}/api/oauth/callback"


def _callback_url(source: str) -> str:
    return f"{CALLBACK_URL}?{urlencode({'provider': source})}"


def _composio_error_detail(error: Exception) -> str:
    message = re.sub(r"ak_[A-Za-z0-9_\-]*", "ak_***", str(error))
    if _is_composio_auth_error(message):
        return (
            "Composio rejected COMPOSIO_API_KEY. Update COMPOSIO_API_KEY in the backend "
            "environment/root .env with a valid key from Composio, then restart the backend."
        )
    return f"Composio error: {message}"


def _is_composio_auth_error(message: str) -> bool:
    lower = message.lower()
    return (
        "invalid api key" in lower
        or "http_unauthorized" in lower
        or "status': 401" in lower
        or "status\": 401" in lower
    )


class ConnectorStatus(BaseModel):
    source: str
    accessible: bool
    connected: bool


class InitiateResponse(BaseModel):
    connection_id: str
    redirect_url: str


@router.get("", response_model=list[ConnectorStatus])
async def list_connector_status(user: User = Depends(get_current_user)) -> list[ConnectorStatus]:
    out: list[ConnectorStatus] = []
    for source in list_connectors():
        accessible = check_source_permission(user, source)
        out.append(ConnectorStatus(source=source, accessible=accessible, connected=False))
    return out


@router.post("/{source}/initiate", response_model=InitiateResponse)
async def initiate_connection(source: str, user: User = Depends(get_current_user)) -> InitiateResponse:
    """Start a Composio OAuth flow. Returns the redirect URL to open in a popup."""
    if not check_source_permission(user, source):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted")

    if source not in composio_client.TOOLKIT_SLUGS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"'{source}' is not a supported connector")

    if not settings.composio_api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Composio not configured (COMPOSIO_API_KEY missing)")

    try:
        connection_id, redirect_url = composio_client.initiate_connection(
            user_id=user.user_id,
            source=source,
            callback_url=_callback_url(source),
        )
        return InitiateResponse(connection_id=connection_id, redirect_url=redirect_url)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        detail = _composio_error_detail(e)
        if _is_composio_auth_error(str(e)):
            log.warning("connector.initiate_composio_auth_error source=%s user=%s", source, user.user_id)
        else:
            log.exception("connector.initiate_error source=%s user=%s", source, user.user_id)
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


@router.delete("/{source}")
async def disconnect_source(source: str, user: User = Depends(get_current_user)) -> dict:
    # Connection deletion is handled by the frontend after clearing from Prisma
    log.info("connector.disconnect_requested", source=source, user_id=user.user_id)
    return {"status": "disconnected"}


@router.get("/{source}/status")
async def connector_status(source: str, user: User = Depends(get_current_user)) -> dict:
    return {"source": source, "connected": False, "status": "unknown"}
