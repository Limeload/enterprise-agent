"""RBAC, JWT validation, and OAuth helpers."""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from core.config import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ---------------------------------------------------------------------------
# Roles & Permissions
# ---------------------------------------------------------------------------

class Role(str, Enum):
    ADMIN = "admin"
    ENGINEER = "engineer"
    ANALYST = "analyst"
    VIEWER = "viewer"


# Map role → set of allowed connector sources
ROLE_SOURCE_PERMISSIONS: dict[Role, set[str]] = {
    Role.ADMIN: {
        "github", "gitlab", "jira", "notion", "confluence", "slack",
        "gmail", "google_drive", "hubspot", "salesforce", "zendesk",
        "snowflake", "bigquery", "postgres",
    },
    Role.ENGINEER: {
        "github", "gitlab", "jira", "notion", "confluence", "slack",
    },
    Role.ANALYST: {
        "notion", "confluence", "slack", "gmail", "snowflake", "bigquery",
        "postgres", "hubspot",
    },
    Role.VIEWER: {
        "notion", "confluence", "slack",
    },
}

# Map role → allowed action verbs
ROLE_ACTION_PERMISSIONS: dict[Role, set[str]] = {
    Role.ADMIN: {"read", "write", "delete", "send", "create", "update"},
    Role.ENGINEER: {"read", "write", "create", "update"},
    Role.ANALYST: {"read"},
    Role.VIEWER: {"read"},
}


class User(BaseModel):
    user_id: str
    email: str
    role: Role
    department: str | None = None
    extra_permissions: list[str] = []


def check_source_permission(user: User, source: str) -> bool:
    allowed = ROLE_SOURCE_PERMISSIONS.get(user.role, set())
    return source in allowed or source in user.extra_permissions


def check_action_permission(user: User, action: str) -> bool:
    allowed = ROLE_ACTION_PERMISSIONS.get(user.role, set())
    return action in allowed


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------

def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.api_secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.api_secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc


def decode_supabase_token(token: str) -> dict[str, Any]:
    """Verify a Supabase Auth access token (HS256, signed with the project JWT secret)."""
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError as exc:
        raise ValueError("Invalid or expired Supabase token") from exc


def user_from_supabase_payload(payload: dict[str, Any]) -> User:
    user_metadata = payload.get("user_metadata", {}) or {}
    role = user_metadata.get("role", "viewer")
    try:
        role_enum = Role(role)
    except ValueError:
        role_enum = Role.VIEWER
    return User(
        user_id=payload.get("sub", ""),
        email=payload.get("email", ""),
        role=role_enum,
        department=user_metadata.get("department"),
        extra_permissions=user_metadata.get("extra_permissions", []),
    )


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
