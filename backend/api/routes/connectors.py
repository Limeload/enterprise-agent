"""Per-user connector connection management — list status, OAuth connect/callback, disconnect."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from api.deps import get_current_user
from connectors import list_connectors
from core.config import settings
from core.security import User, check_source_permission
from db import connections as connections_db
from integrations import composio_client

router = APIRouter(prefix="/connectors", tags=["connectors"])


class ConnectorStatus(BaseModel):
    source: str
    accessible: bool
    connected: bool
    status: str | None = None


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
        ))
    return out


class ConnectResponse(BaseModel):
    redirect_url: str


@router.post("/{source}/connect", response_model=ConnectResponse)
async def connect_source(source: str, user: User = Depends(get_current_user)) -> ConnectResponse:
    if not check_source_permission(user, source):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not permitted for this role")

    if not composio_client.auth_config_id_for(source):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"'{source}' has no Composio auth config configured on the backend yet",
        )

    callback_url = f"{settings.backend_url}/api/v1/connectors/{source}/callback"
    try:
        connection = composio_client.initiate_connection(user.user_id, source, callback_url)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    connections_db.upsert_connection(
        user_id=user.user_id,
        source=source,
        status="pending",
        composio_connection_id=connection.id,
    )
    return ConnectResponse(redirect_url=connection.redirect_url)


@router.get("/{source}/callback")
async def connector_callback(source: str, connectedAccountId: str = Query(...)) -> RedirectResponse:
    """Composio redirects the browser here after the user finishes the provider OAuth flow."""
    try:
        result = composio_client.get_connection_status(connectedAccountId)
        status_value = "connected" if getattr(result, "status", "") == "ACTIVE" else "error"
    except Exception:
        status_value = "error"

    record = connections_db.get_connection_by_composio_id(connectedAccountId)
    if record:
        connections_db.upsert_connection(
            user_id=record["user_id"],
            source=source,
            status=status_value,
            composio_connection_id=connectedAccountId,
        )

    return RedirectResponse(url=f"{settings.frontend_url}/connectors?source={source}&status={status_value}")


@router.delete("/{source}")
async def disconnect_source(source: str, user: User = Depends(get_current_user)) -> dict:
    record = connections_db.get_connection(user.user_id, source)
    if record and record.get("composio_connection_id"):
        try:
            composio_client.delete_connection(record["composio_connection_id"])
        except Exception:
            pass
    connections_db.delete_connection(user.user_id, source)
    return {"status": "disconnected"}
