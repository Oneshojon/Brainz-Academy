"""
services/ai_service.py

All Anthropic Claude API calls for BrainzAcademy go through this module.
Views must never instantiate anthropic.Anthropic() directly.

Why
---
- Circuit breaker: Anthropic overloaded → fast fail after 2 failures →
  lesson notes page shows clear "unavailable" message instead of hanging
- "Generate once, cache on accept" pattern enforced here via docstring contract
- Single place to swap model versions
"""

import logging

import anthropic
from django.conf import settings

from utils.circuit_breaker import CircuitOpenError, circuit_breaker

logger = logging.getLogger(__name__)

# Single shared client — connection pooling across requests
_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


# ── Custom exception ──────────────────────────────────────────────────────────

class AIUnavailableError(Exception):
    """
    Raised when the Anthropic circuit is OPEN or the API call failed.
    Views must catch this and return a JSON error the frontend can display.
    """
    pass


# ── Circuit-breaker-protected API call ────────────────────────────────────────

@circuit_breaker("anthropic")
def _call_claude(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int,
    timeout=None,   # injected by circuit_breaker decorator
) -> str:
    """
    Raw Claude API call. Returns the text content of the first response block.
    `timeout` is passed to the Anthropic SDK's httpx client.
    """
    client  = _get_client()
    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
        timeout=timeout,
    )
    return message.content[0].text


# ── Public API ────────────────────────────────────────────────────────────────

def generate_lesson_note(topic_name: str, subject_name: str, prompt: str) -> str:
    """
    Generate AI lesson notes for a topic using the provided prompt.

    IMPORTANT: The caller (view) is responsible for persisting the result
    to LessonNote.ai_content once the teacher accepts it. Never call this
    function a second time for the same topic — always check DB first.

    Args:
        topic_name   : e.g. "Hooke's Law"
        subject_name : e.g. "Physics"
        prompt       : the full structured prompt string from the view

    Returns:
        Generated lesson note text.

    Raises:
        AIUnavailableError : circuit OPEN, API timeout, or API overloaded
    """
    try:
        text = _call_claude(
            system_prompt=(
                f"You are an expert {subject_name} teacher and examiner "
                f"preparing revision notes for Nigerian secondary school students "
                f"writing WAEC, NECO, or JAMB."
            ),
            user_prompt=prompt,
            max_tokens=7000,
        )
        logger.info(
            "Lesson note generated for '%s › %s'.", subject_name, topic_name
        )
        return text

    except CircuitOpenError:
        raise AIUnavailableError(
            "AI lesson note generation is temporarily unavailable. "
            "Please try again in a few minutes."
        )
    except anthropic.APITimeoutError:
        raise AIUnavailableError(
            "The AI took too long to respond. Please try again."
        )
    except anthropic.APIStatusError as exc:
        logger.error(
            "Anthropic API status error %s for topic '%s': %s",
            exc.status_code, topic_name, exc.message,
        )
        if exc.status_code in (529, 503):
            raise AIUnavailableError(
                "The AI service is currently overloaded. Please try again shortly."
            )
        # Other status errors (4xx) — re-raise as AIUnavailableError so view
        # returns a clean JSON error rather than an unhandled 500
        raise AIUnavailableError(
            f"AI service returned an error ({exc.status_code}). Please try again."
        )
    except Exception as exc:
        logger.error(
            "Unexpected error generating lesson note for '%s': %s",
            topic_name, exc,
        )
        raise AIUnavailableError(
            "An unexpected error occurred. Please try again."
        )