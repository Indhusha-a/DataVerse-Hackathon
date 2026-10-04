"""
Central settings for the ML/AI service, loaded from environment variables
(or a local .env file during development). LLM_PROVIDER is the single switch
that picks which provider implementation app/providers/factory.py returns —
nothing else in the codebase needs to change when you switch providers.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Which provider to use: "groq" | "gemini" | "openrouter"
    llm_provider: str = "groq"

    groq_api_key: str = ""
    gemini_api_key: str = ""
    openrouter_api_key: str = ""

    # Model ids change as providers deprecate old ones — Groq retired
    # llama-3.3-70b-versatile after this was first written, for example.
    # Override via env var rather than editing provider code when that
    # happens again; check the provider's current model list first.
    groq_model: str = "qwen/qwen3.8-27b"
    gemini_model: str = "gemini-1.5-flash"
    openrouter_model: str = "meta-llama/llama-3.3-70b-instruct"

    # Base URL of the Spring Boot backend, used by the agent tools.
    backend_base_url: str = "http://localhost:8080"

    port: int = 8000


# Imported wherever settings are needed: `from app.config import settings`
settings = Settings()