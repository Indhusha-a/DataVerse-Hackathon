"""Health check — used by Docker Compose's healthcheck and by anyone
confirming the service is up before wiring the frontend to it."""

from fastapi import APIRouter
from app.config import settings

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok", "provider": settings.llm_provider}