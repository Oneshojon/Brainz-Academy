"""
Tests for contact/services.py — client IP extraction and rate limiting.
"""

import pytest
from django.core.cache import cache
from django.test import RequestFactory
from unittest.mock import patch

from contact.services import (
    RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_SECONDS,
    get_client_ip,
    is_rate_limited,
)


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


class TestGetClientIp:
    def test_uses_x_forwarded_for_when_present(self, rf: RequestFactory):
        """Railway sits behind a proxy — X-Forwarded-For takes priority."""
        request = rf.get("/", HTTP_X_FORWARDED_FOR="203.0.113.5, 10.0.0.1")
        assert get_client_ip(request) == "203.0.113.5"

    def test_strips_whitespace_from_forwarded_for(self, rf: RequestFactory):
        request = rf.get("/", HTTP_X_FORWARDED_FOR="  198.51.100.7  , 10.0.0.1")
        assert get_client_ip(request) == "198.51.100.7"

    def test_falls_back_to_remote_addr_when_no_proxy_header(self, rf: RequestFactory):
        request = rf.get("/")
        request.META["REMOTE_ADDR"] = "127.0.0.1"
        assert get_client_ip(request) == "127.0.0.1"

    def test_returns_none_when_neither_header_present(self, rf: RequestFactory):
        request = rf.get("/")
        request.META.pop("REMOTE_ADDR", None)
        assert get_client_ip(request) is None


class TestIsRateLimited:
    def test_none_ip_fails_open_not_limited(self):
        """No IP to key on — fail open rather than block a legitimate user."""
        assert is_rate_limited(None) is False

    def test_first_submission_in_window_is_not_limited(self):
        assert is_rate_limited("10.0.0.1") is False

    def test_allows_up_to_max_then_blocks(self):
        ip = "10.0.0.2"
        for _ in range(RATE_LIMIT_MAX):
            assert is_rate_limited(ip) is False
        assert is_rate_limited(ip) is True

    def test_resets_after_key_expiry(self):
        """
        Simulates the window expiring between add() and incr() by manually
        deleting the cache key mid-window — exercises the ValueError branch
        in is_rate_limited() where cache.incr() hits a missing key.
        """
        ip = "10.0.0.3"
        is_rate_limited(ip)  # seeds the key via cache.add()
        cache.delete(f"contact:rate:{ip}")
        assert is_rate_limited(ip) is False

    def test_different_ips_have_independent_windows(self):
        for _ in range(RATE_LIMIT_MAX):
            is_rate_limited("10.0.0.4")
        assert is_rate_limited("10.0.0.4") is True
        assert is_rate_limited("10.0.0.5") is False


class TestIsRateLimitedIncrRace:
    def test_incr_value_error_resets_window_and_allows_request(self):
        """
        Exercises the true race-condition branch: cache.add() finds the key
        already present (so is_first_in_window is False), but the key
        expires before cache.incr() runs, which raises ValueError. The
        handler should treat this as a fresh window rather than propagate
        the error or incorrectly block the request.
        """
        ip = "10.0.0.9"
        key = f"contact:rate:{ip}"
        cache.set(key, 1, timeout=RATE_LIMIT_WINDOW_SECONDS)  # simulates add() returning False

        with patch("contact.services.cache.incr", side_effect=ValueError):
            result = is_rate_limited(ip)

        assert result is False
        assert cache.get(key) == 1  # window reset via cache.set() in the except block