"""
contact/services.py

Support helpers for the Contact Us view: real client IP extraction
(accounting for Railway's reverse proxy) and a per-IP rate limiter backed
by Django's cache framework (Redis in production, matching the pattern
already used by the circuit breaker).
"""

from typing import Optional

from django.core.cache import cache

RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW_SECONDS = 60 * 60  # 1 hour


def get_client_ip(request) -> Optional[str]:
    """
    Best-effort client IP extraction. Railway sits behind a proxy, so
    X-Forwarded-For is checked first; REMOTE_ADDR is the fallback for
    local/dev environments where no proxy header is present.
    """
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def is_rate_limited(ip_address: Optional[str]) -> bool:
    """
    Fixed-window rate limiter: allows RATE_LIMIT_MAX submissions per
    RATE_LIMIT_WINDOW_SECONDS per IP address.

    Uses cache.add() + cache.incr() (not get/set) to avoid a
    read-modify-write race between concurrent requests from the same IP.
    """
    if not ip_address:
        # Can't rate-limit without an IP — fail open rather than block a
        # legitimate user because of a missing header.
        return False

    key = f"contact:rate:{ip_address}"
    is_first_in_window = cache.add(key, 1, timeout=RATE_LIMIT_WINDOW_SECONDS)
    if is_first_in_window:
        return False

    try:
        current_count = cache.incr(key)
    except ValueError:
        # Key expired between add() and incr() — treat as a fresh window.
        cache.set(key, 1, timeout=RATE_LIMIT_WINDOW_SECONDS)
        return False

    return current_count > RATE_LIMIT_MAX