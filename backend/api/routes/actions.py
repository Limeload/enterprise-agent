"""POST /actions — direct action endpoints with human approval gate."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from api.deps import get_current_user
from connectors import get_connector
from core.security import User, check_action_permission

router = APIRouter(prefix="/actions", tags=["actions"])


def _require_write(user: User) -> None:
    if not check_action_permission(user, "write"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Write permission required")


# ---------------------------------------------------------------------------
# GitHub actions
# ---------------------------------------------------------------------------

class CreateIssueRequest(BaseModel):
    repo: str
    title: str
    body: str = ""
    labels: list[str] = []


@router.post("/github/issues")
async def create_github_issue(
    req: CreateIssueRequest,
    user: User = Depends(get_current_user),
) -> dict:
    _require_write(user)
    connector = get_connector("github", user_id=user.user_id)
    if connector is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="GitHub is not connected")
    result = await connector.create_issue(repo=req.repo, title=req.title, body=req.body, labels=req.labels)
    return result


# ---------------------------------------------------------------------------
# Slack actions
# ---------------------------------------------------------------------------

class PostSlackMessageRequest(BaseModel):
    channel: str
    text: str
    thread_ts: str | None = None


@router.post("/slack/messages")
async def post_slack_message(
    req: PostSlackMessageRequest,
    user: User = Depends(get_current_user),
) -> dict:
    _require_write(user)
    connector = get_connector("slack", user_id=user.user_id)
    if connector is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slack is not connected")
    result = await connector.post_message(channel=req.channel, text=req.text, thread_ts=req.thread_ts)
    return result


# ---------------------------------------------------------------------------
# Human approval endpoint (for agent-initiated write actions)
# ---------------------------------------------------------------------------

class ApprovalRequest(BaseModel):
    session_id: str
    approved: bool
    reason: str = ""


@router.post("/approve")
async def approve_action(
    req: ApprovalRequest,
    user: User = Depends(get_current_user),
) -> dict:
    """Resume a paused agent graph after a human approves or rejects the pending action."""
    # In a full implementation, resume the LangGraph thread via its checkpointer
    # For now, record the decision and return it
    return {
        "session_id": req.session_id,
        "approved": req.approved,
        "approved_by": user.user_id,
        "reason": req.reason,
    }
