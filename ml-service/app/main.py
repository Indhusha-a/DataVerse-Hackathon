"""
FastAPI entry point. Mirrors the Spring Boot backend's CORS setup so the
same frontend origins can call either service directly during local dev.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, chat

app = FastAPI(title="Waypoint AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(chat.router)


@app.get("/")
async def root():
    return {"service": "waypoint-ai-service", "status": "running"}