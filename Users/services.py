"""
Users/services.py

Rate limiting for the OTP login/registration flow. A per-key fixed-window counter backed by
Django's cache framework (Redis in production), using cache.add() +
cache.incr() to avoid a read-modify-write race between concurrent
requests hitting the same key.

Two things are protected here, independently:

1. OTP *requests* (the email-send endpoint, Users.views.request_otp) —
   capped both by IP and by target email. 
2. OTP *verification attempts* (the guess-the-code endpoint,
   Users.views.verify_otp) — capped by email only. Guessing a 6-digit
   code is meaningful against one specific account regardless of which
   IP the guesses come from, so IP-based limiting alone wouldn't close
   this off.
"""

from typing import Optional

from django.core.cache import cache

# How many OTP-send requests a single IP may trigger in the window.
# Looser than the per-email limit — shared IPs (school/office networks)
# are common here, and this exists mainly to blunt scripted abuse, not
# to police ordinary multi-user traffic from one address.
OTP_REQUEST_IP_MAX = 10
OTP_REQUEST_IP_WINDOW_SECONDS = 15 * 60  # 15 minutes

# How many OTP-send requests a single target email may receive in the
# window. This is the limit that actually stops inbox-bombing.
OTP_REQUEST_EMAIL_MAX = 5
OTP_REQUEST_EMAIL_WINDOW_SECONDS = 60 * 60  # 1 hour

# How many wrong OTP guesses a single email may make before
# verification is locked out for that email. Matches the OTP's own
# 10-minute validity window (see verify_otp) — once the code expires
# anyway, a fresh request_otp resets both windows together.
OTP_VERIFY_MAX = 5
OTP_VERIFY_WINDOW_SECONDS = 10 * 60  # 10 minutes


def get_client_ip(request) -> Optional[str]:
    """
    Best-effort client IP extraction. Railway sits behind a proxy, so
    X-Forwarded-For is checked first; REMOTE_ADDR is the fallback for
    local/dev environments where no proxy header is present.

    Duplicated from contact/services.py rather than imported, to avoid
    a Users -> contact dependency for a five-line helper. Worth
    promoting to a shared services/request_utils.py if a third app
    ever needs it.
    """
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _fixed_window_rate_limited(key: str, max_count: int, window_seconds: int) -> bool:
    """
    Generic fixed-window counter: allows `max_count` hits per
    `window_seconds` for the given cache key. Same race-safe
    add()+incr() approach as contact.services.is_rate_limited, factored
    out here since this module needs three independent counters
    (request-by-ip, request-by-email, verify-by-email) sharing one
    implementation.
    """
    is_first_in_window = cache.add(key, 1, timeout=window_seconds)
    if is_first_in_window:
        return False

    try:
        current_count = cache.incr(key)
    except ValueError:
        # Key expired between add() and incr() — treat as a fresh window.
        cache.set(key, 1, timeout=window_seconds)
        return False

    return current_count > max_count


def is_otp_request_rate_limited(ip_address: Optional[str], email: str) -> bool:
    """
    True if this OTP-send request should be blocked — either the
    source IP or the target email has hit its cap.

    Both counters are advanced regardless of which trips first (no
    short-circuit), so an attacker splitting requests across many IPs
    still exhausts the per-email budget instead of resetting it.
    """
    ip_limited = False
    if ip_address:
        ip_limited = _fixed_window_rate_limited(
            f"otp:request:ip:{ip_address}", OTP_REQUEST_IP_MAX, OTP_REQUEST_IP_WINDOW_SECONDS,
        )

    email_limited = _fixed_window_rate_limited(
        f"otp:request:email:{email}", OTP_REQUEST_EMAIL_MAX, OTP_REQUEST_EMAIL_WINDOW_SECONDS,
    )

    return ip_limited or email_limited


def is_otp_verify_rate_limited(email: str) -> bool:
    """
    True if this email has made too many wrong OTP guesses in the
    current window.

    Call this only on a *wrong* guess (see Users.views.verify_otp) — a
    correct guess ends the flow immediately and doesn't need to consume
    any budget.
    """
    return _fixed_window_rate_limited(
        f"otp:verify:{email}", OTP_VERIFY_MAX, OTP_VERIFY_WINDOW_SECONDS,
    )