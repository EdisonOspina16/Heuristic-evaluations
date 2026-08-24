"""Gemini insights generation and Server-Sent Events formatting."""

import json
import logging
import os
from collections.abc import AsyncIterator
from typing import Any
from google import genai
from google.genai import types

from .ai_prompts import build_prompt

logger = logging.getLogger(__name__)


class GeminiConfigurationError(RuntimeError):
    """Raised when Gemini is not configured correctly."""


class AiInsightsService:
    """Generate project insights with Gemini and stream them as SSE."""

    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

        if not self.api_key:
            raise GeminiConfigurationError("GEMINI_API_KEY no está configurada")
        if not self.model:
            raise GeminiConfigurationError("GEMINI_MODEL no puede estar vacío")

    async def stream_insights(self, payload: Any) -> AsyncIterator[str]:
        

        system_prompt, user_prompt = build_prompt(payload)
        yield self._event("start", {"model": self.model, "provider": "gemini"})

        client = genai.Client(api_key=self.api_key)
        try:
            stream = await client.aio.models.generate_content_stream(
                model=self.model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.2,
                ),
            )
            async for chunk in stream:
                if chunk.text:
                    yield self._event("token", {"text": chunk.text})
        except Exception as exc:
            logger.exception("Gemini insights generation failed", extra={"model": self.model})
            yield self._event("error", {"message": str(exc) or "Gemini no pudo generar los insights"})
            return
        finally:
            await client.aio.aclose()

        yield self._event("done", {"ok": True})

    @staticmethod
    def _event(event: str, data: dict[str, Any]) -> str:
        return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
