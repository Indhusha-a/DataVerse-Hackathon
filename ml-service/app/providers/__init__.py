"""
LLM provider implementations and the factory that selects between them.

Usage elsewhere in the app: `from app.providers import get_provider`.
Callers only use `.complete()` on the object get_provider() returns and never
import a concrete provider class, so LLM_PROVIDER=groq|gemini|openrouter is a
configuration change only.
"""

from abc import ABC, abstractmethod

from app.config import settings


class LLMProvider(ABC):
    """Common interface every provider implements."""

    @abstractmethod
    async def complete(self, messages: list[dict], **kwargs) -> str:
        """messages is a list of {"role": "system"|"user"|"assistant", "content": str}.
        Returns the assistant's reply as plain text."""
        raise NotImplementedError


class GroqProvider(LLMProvider):
    """Fast inference, OpenAI-compatible chat completion shape. The client
    is only instantiated (API key read, client object built) when
    .complete() is actually called, not at construction — so the factory
    can be exercised in tests without ever needing a real key."""

    def __init__(self, model: str | None = None):
        self.model = model or settings.groq_model

    async def complete(self, messages: list[dict], **kwargs) -> str:
        from groq import AsyncGroq  # imported lazily so a missing key never breaks import-time
        client = AsyncGroq(api_key=settings.groq_api_key)
        response = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=kwargs.get("temperature", 0.3),
        )
        return response.choices[0].message.content


class GeminiProvider(LLMProvider):
    """Google Gemini provider."""

    def __init__(self, model: str | None = None):
        self.model = model or settings.gemini_model

    async def complete(self, messages: list[dict], **kwargs) -> str:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)

        # Gemini doesn't use the OpenAI-style {role, content} message list
        # directly — flatten to a single prompt for this minimal provider.
        prompt = "\n\n".join(f"{m['role'].upper()}: {m['content']}" for m in messages)
        model = genai.GenerativeModel(self.model)
        response = await model.generate_content_async(prompt)
        return response.text


class OpenRouterProvider(LLMProvider):
    """OpenRouter exposes an OpenAI-compatible API, so this reuses the
    `openai` SDK pointed at OpenRouter's base_url instead of writing a
    bespoke client."""

    def __init__(self, model: str | None = None):
        self.model = model or settings.openrouter_model

    async def complete(self, messages: list[dict], **kwargs) -> str:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openrouter_api_key, base_url="https://openrouter.ai/api/v1")
        response = await client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=kwargs.get("temperature", 0.3),
        )
        return response.choices[0].message.content


def get_provider() -> LLMProvider:
    """The one switch point. Every other part of the codebase asks for a
    provider through this function and never imports a concrete provider
    class directly."""
    provider = settings.llm_provider.lower()
    if provider == "groq":
        return GroqProvider()
    if provider == "gemini":
        return GeminiProvider()
    if provider == "openrouter":
        return OpenRouterProvider()
    raise ValueError(f"Unknown LLM_PROVIDER: {settings.llm_provider}")
