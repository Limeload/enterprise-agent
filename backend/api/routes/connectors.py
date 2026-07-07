"""Connector management API — list status, save Nango connection, disconnect."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from api.deps import get_current_user
from connectors import list_connectors
from core.security import User, check_source_permission
from db import connections as connections_db
from integrations import nango_client

log = logging.getLogger(__name__)
router = APIRouter(prefix="/connectors", tags=["connectors"])


class ConnectorStatus(BaseModel):
    source: str
    accessible: bool
    connected: bool
    status: str | None = None
    nango_connection_id: str | None = None


@router.get("", response_model=list[ConnectorStatus])
async def list_connector_status(user: User = Depends(get_current_user)) -> list[ConnectorStatus]:
    existing = {c["source"]: c for c in connections_db.list_connections(user.user_id)}
    out: list[ConnectorStatus] = []
    for source in list_connectors():
        accessible = check_source_permission(user, source)
        record = existing.get(source)
        out.append(ConnectorStatus(
            source=source,
            accessible=accessible,
            connected=bool(record and record.get("status") == "connected"),
            status=record.get("status") if record else None,
            nango_connection_id=record.get("nango_connection_id") if record else None,
        ))
    return out


class SaveConnectionRequest(BaseModel):
    nango_connection_id: str
    scopes: list[str] = []
    provider_account_email: str | None = None
    provider_account_id: str | None = None


@router.post("/{source}/save")
async def save_connection(
    source: str,
    body: SaveConnectionRequest,
    user: User = Depends(get_current_user),
) -> dict:
    """Called by the frontend after Nango OAuth completes successfully.

    The frontend SDK handles the OAuth popup; this endpoint persists the
    resulting Nango connection ID in BrainCache's database.
    """
    if not check_source_permission(user, source):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted for this role")

    if not nango_client.provider_config_key(source):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{source}' is not a supported Nango connector",
        )

    connections_db.upsert_connection(
        user_id=user.user_id,
        source=source,
        status="connected",
        nango_connection_id=body.nango_connection_id,
        metadata={
            "scopes": body.scopes,
            "provider_account_email": body.provider_account_email,
            "provider_account_id": body.provider_account_id,
        },
    )

    log.info("connector.saved", source=source, user_id=user.user_id)
    return {"status": "connected", "source": source}


@router.delete("/{source}")
async def disconnect_source(source: str, user: User = Depends(get_current_user)) -> dict:
    record = connections_db.get_connection(user.user_id, source)
    if record and record.get("nango_connection_id"):
        deleted = await nango_client.delete_connection(source, record["nango_connection_id"])
        if not deleted:
            log.warning("nango.delete_failed", source=source, user_id=user.user_id)
    connections_db.delete_connection(user.user_id, source)
    log.info("connector.disconnected", source=source, user_id=user.user_id)
    return {"status": "disconnected"}


@router.get("/{source}/status")
async def connector_status(source: str, user: User = Depends(get_current_user)) -> dict:
    record = connections_db.get_connection(user.user_id, source)
    return {
        "source": source,
        "connected": bool(record and record.get("status") == "connected"),
        "status": record.get("status") if record else "disconnected",
    }
