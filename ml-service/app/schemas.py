"""Pydantic request/response shapes for the API endpoints."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    context: dict | None = None  # e.g. {"current_page": "...", "selected_order": "..."}


class ChatResponse(BaseModel):
    reply: str
    tool_calls: list[str] = []
