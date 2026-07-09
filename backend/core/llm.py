"""Small provider adapter for agent LLM calls."""
from __future__ import annotations

import asyncio
from typing import Any

from anthropic import AsyncAnthropic

from core.config import settings

_anthropic_client: AsyncAnthropic | None = None


def _anthropic() -> AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _anthropic_client


def _messages_to_prompt(system: str, messages: list[dict[str, str]]) -> str:
    parts = [f"System:\n{system}"] if system else []
    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "")
        parts.append(f"{role.title()}:\n{content}")
    return "\n\n".join(parts)


async def generate_text(
    *,
    system: str,
    messages: list[dict[str, str]],
    max_tokens: int,
    model: str | None = None,
) -> str:
    """Generate text from the configured provider.

    Anthropic is used when ANTHROPIC_API_KEY is present. Otherwise Gemini is
    used when GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY is present.
    """
    selected_model = model or settings.llm_model

    if settings.anthropic_api_key:
        response = await _anthropic().messages.create(
            model=selected_model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        return response.content[0].text if response.content else ""

    if settings.gemini_api_key:
        return await asyncio.to_thread(
            _generate_gemini,
            system=system,
            messages=messages,
            max_tokens=max_tokens,
            model=selected_model,
        )

    raise RuntimeError(
        "No LLM API key configured. Set ANTHROPIC_API_KEY, GEMINI_API_KEY, or GOOGLE_GENERATIVE_AI_API_KEY."
    )


def _generate_gemini(*, system: str, messages: list[dict[str, str]], max_tokens: int, model: str) -> str:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    generation_config: dict[str, Any] = {"max_output_tokens": max_tokens}
    gemini = genai.GenerativeModel(model, generation_config=generation_config)
    response = gemini.generate_content(_messages_to_prompt(system, messages))
    return response.text or ""
