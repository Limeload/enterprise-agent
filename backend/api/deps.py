"""FastAPI dependency injection helpers."""
from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.config import settings
from core.security import (
    User,
    Role,
    decode_access_token,
    decode_supabase_token,
    user_from_supabase_payload,
)

bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> User:
    """Extract and validate the bearer token (Supabase session, or internal JWT), return the User."""
    if credentials is None:
        if settings.app_env == "development":
            forwarded_user_id = request.headers.get("x-user-id")
            if forwarded_user_id:
                return User(
                    user_id=forwarded_user_id,
                    email=request.headers.get("x-user-email", f"{forwarded_user_id}@clerk.local"),
                    role=Role.ADMIN,
                )
            # Dev convenience: return a mock admin when no token is provided
            return User(user_id="dev-user", email="dev@company.com", role=Role.ADMIN)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing credentials")

    if settings.supabase_jwt_secret:
        try:
            payload = decode_supabase_token(credentials.credentials)
            return user_from_supabase_payload(payload)
        except ValueError:
            pass

    try:
        payload = decode_access_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return User(
        user_id=payload.get("sub", ""),
        email=payload.get("email", ""),
        role=Role(payload.get("role", "viewer")),
        department=payload.get("department"),
        extra_permissions=payload.get("extra_permissions", []),
    )
