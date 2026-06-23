"""Email/password authentication backed by Supabase Auth."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from api.deps import get_current_user
from core.security import User
from db.supabase import get_supabase

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


@router.post("/signup", response_model=SessionResponse)
async def signup(req: SignupRequest) -> SessionResponse:
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


@router.post("/login", response_model=SessionResponse)
async def login(req: LoginRequest) -> SessionResponse:
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


@router.post("/logout")
async def logout(user: User = Depends(get_current_user)) -> dict:
    return {"status": "ok"}


@router.get("/me")
async def me(user: User = Depends(get_current_user)) -> User:
    return user
