"""Email/password authentication — backed by Supabase Auth when configured, SQLite otherwise."""
from __future__ import annotations

import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from api.deps import get_current_user
from core.security import User, create_access_token, hash_password, verify_password
from db.supabase import get_supabase
import db.local_store as _local

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SessionResponse(BaseModel):
    access_token: str
    refresh_token: str | None
    user_id: str
    email: str
    role: str


def _use_supabase() -> bool:
    return get_supabase() is not None


@router.post("/signup", response_model=SessionResponse)
async def signup(req: SignupRequest) -> SessionResponse:
    if _use_supabase():
        supabase = get_supabase()
        try:
            result = supabase.auth.sign_up({
                "email": req.email,
                "password": req.password,
                "options": {"data": {"role": "viewer"}},
            })
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        if result.user is None or result.session is None:
            raise HTTPException(
                status_code=status.HTTP_202_ACCEPTED,
                detail="Signup succeeded — check your email to confirm your account before logging in.",
            )

        supabase.table("users").upsert({
            "user_id": result.user.id,
            "email": req.email,
            "role": "viewer",
        }, on_conflict="user_id").execute()

        return SessionResponse(
            access_token=result.session.access_token,
            refresh_token=result.session.refresh_token,
            user_id=result.user.id,
            email=req.email,
            role="viewer",
        )

    # ---- Local auth ----
    _local.init_db()
    if _local.get_user_by_email(req.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_id = str(uuid.uuid4())
    _local.create_user(user_id, req.email, hash_password(req.password), role="admin")

    token = create_access_token(
        {"sub": user_id, "email": req.email, "role": "admin"},
        expires_delta=timedelta(days=7),
    )
    return SessionResponse(access_token=token, refresh_token=None, user_id=user_id, email=req.email, role="admin")


@router.post("/login", response_model=SessionResponse)
async def login(req: LoginRequest) -> SessionResponse:
    if _use_supabase():
        supabase = get_supabase()
        try:
            result = supabase.auth.sign_in_with_password({"email": req.email, "password": req.password})
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        role = (result.user.user_metadata or {}).get("role", "viewer")
        return SessionResponse(
            access_token=result.session.access_token,
            refresh_token=result.session.refresh_token,
            user_id=result.user.id,
            email=result.user.email or req.email,
            role=role,
        )

    # ---- Local auth ----
    _local.init_db()
    user = _local.get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(
        {"sub": user["user_id"], "email": user["email"], "role": user["role"]},
        expires_delta=timedelta(days=7),
    )
    return SessionResponse(
        access_token=token,
        refresh_token=None,
        user_id=user["user_id"],
        email=user["email"],
        role=user["role"],
    )


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)) -> dict:
    return {"status": "ok"}


@router.get("/me")
async def me(user: User = Depends(get_current_user)) -> User:
    return user
