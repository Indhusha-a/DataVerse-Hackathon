"""
Chat endpoint. The caller's JWT arrives in the Authorization header. The
role used to choose the agent's tools is read from that token, not from the
request body. Every tool call is forwarded with the same token, so the
Spring Boot backend still enforces access on each call.
"""

import base64
import json

from fastapi import APIRouter, Header, HTTPException
from app.schemas import ChatRequest, ChatResponse
from app.agent import run_agent

router = APIRouter()


def _role_from_jwt(token: str) -> str:
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        claims = json.loads(base64.urlsafe_b64decode(payload))
        return claims["role"]
    except (IndexError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Malformed bearer token")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    jwt = authorization.removeprefix("Bearer ")
    role = _role_from_jwt(jwt)

    reply, tool_calls = await run_agent(role, request.message, request.context, jwt)
    return ChatResponse(reply=reply, tool_calls=tool_calls)
