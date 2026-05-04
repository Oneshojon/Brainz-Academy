"""
utils/circuit_breaker.py

Redis-backed Circuit Breaker for BrainzAcademy's external API integrations.

States
------
  CLOSED    — normal operation; calls go through; failures are counted
  OPEN      — breaker tripped; calls rejected immediately (fast fail)
  HALF_OPEN — one probe allowed after cooldown;
               success → CLOSED, failure → OPEN

Redis keys (per service name, prefixed by Django KEY_PREFIX)
-------------------------------------------------------------
  cb:{name}:state      STR — "closed" | "open" | "half_open"
  cb:{name}:failures   INT — consecutive failure count
  cb:{name}:opened_at  STR — ISO timestamp when breaker was opened

Usage
-----
    from utils.circuit_breaker import circuit_breaker, CircuitOpenError

    @circuit_breaker("brevo")
    def _send_mail(..., timeout=None):
        ...  # timeout is injected automatically by the decorator

    try:
        _send_mail(...)
    except CircuitOpenError:
        # show user-friendly fallback
"""

import functools
import logging
import time
from dataclasses import dataclass
from typing import Callable, Optional

from django.core.cache import cache

logger = logging.getLogger(__name__)


# ── Per-service configuration ─────────────────────────────────────────────────

@dataclass
class CircuitConfig:
    """
    Tuning parameters for a single external service.

    failure_threshold : consecutive failures before tripping to OPEN
    recovery_timeout  : seconds to stay OPEN before allowing a probe
    call_timeout      : seconds to wait for one external call (injected into
                        wrapped function as `timeout` kwarg)
    redis_ttl         : Redis key TTL — must exceed recovery_timeout
    """
    failure_threshold: int = 3
    recovery_timeout:  int = 60
    call_timeout:      int = 10
    redis_ttl:         int = 300


# Agreed thresholds from design discussion
SERVICE_CONFIGS: dict[str, CircuitConfig] = {
    "brevo": CircuitConfig(
        failure_threshold=3,
        recovery_timeout=60,
        call_timeout=8,
    ),
    "paystack": CircuitConfig(
        failure_threshold=3,
        recovery_timeout=30,   # shorter — payments are time-critical
        call_timeout=15,       # generous — Paystack can legitimately be slow
    ),
    "anthropic": CircuitConfig(
        failure_threshold=3,
        recovery_timeout=120,  # AI outages tend to last longer
        call_timeout=90,       # generative calls take real time
    ),
}


# ── Custom exceptions ─────────────────────────────────────────────────────────

class CircuitOpenError(Exception):
    """
    Raised when a call is rejected because the breaker is OPEN.
    Callers must catch this and return a user-friendly response —
    never let it propagate as an unhandled 500.
    """
    def __init__(self, service: str):
        self.service = service
        super().__init__(
            f"Circuit breaker OPEN for '{service}'. "
            f"Service temporarily unavailable — please try again shortly."
        )


# ── Redis key helpers ─────────────────────────────────────────────────────────

def _key(name: str, field: str) -> str:
    """Build a namespaced Redis key."""
    return f"cb:{name}:{field}"


def _get_state(name: str) -> str:
    return cache.get(_key(name, "state"), "closed")


def _get_failures(name: str) -> int:
    value = cache.get(_key(name, "failures"), 0)
    return int(value)


def _get_opened_at(name: str) -> Optional[float]:
    value = cache.get(_key(name, "opened_at"))
    return float(value) if value is not None else None


def _set_state(name: str, state: str, ttl: int) -> None:
    cache.set(_key(name, "state"), state, ttl)


def _increment_failures(name: str, ttl: int) -> int:
    """Atomically increment failure counter. Returns new count."""
    key = _key(name, "failures")
    try:
        return cache.incr(key)
    except ValueError:
        # Key does not exist yet
        cache.set(key, 1, ttl)
        return 1


def _reset(name: str) -> None:
    """Delete all Redis keys for this breaker — returns to CLOSED."""
    cache.delete(_key(name, "state"))
    cache.delete(_key(name, "failures"))
    cache.delete(_key(name, "opened_at"))


def _trip(name: str, config: CircuitConfig) -> None:
    """Transition to OPEN state and record the timestamp."""
    ttl = config.redis_ttl
    cache.set(_key(name, "state"),     "open",        ttl)
    cache.set(_key(name, "opened_at"), str(time.time()), ttl)
    logger.error(
        "Circuit breaker OPENED for '%s'. "
        "All calls rejected for %ds. Failure threshold %d reached.",
        name, config.recovery_timeout, config.failure_threshold,
    )


# ── State machine ─────────────────────────────────────────────────────────────

def _should_allow_call(name: str, config: CircuitConfig) -> bool:
    """
    Determine whether the call should proceed.
    May transition OPEN → HALF_OPEN as a side effect.
    """
    state = _get_state(name)

    if state == "closed":
        return True

    if state == "open":
        opened_at = _get_opened_at(name)
        if opened_at and (time.time() - opened_at) >= config.recovery_timeout:
            # Cooldown elapsed — allow one probe through
            _set_state(name, "half_open", config.redis_ttl)
            logger.info(
                "Circuit breaker '%s' → HALF_OPEN (probe allowed after %ds cooldown).",
                name, config.recovery_timeout,
            )
            return True
        # Still cooling down
        return False

    if state == "half_open":
        # One probe is already in flight — allow it; subsequent callers
        # will also see half_open and be allowed through, but _on_failure
        # will immediately re-open if the probe fails. This is intentional:
        # we prefer slightly optimistic probing over complex locking.
        return True

    # Unknown state — default to allowing
    return True


def _on_success(name: str) -> None:
    """Record a successful call. Reset breaker to CLOSED."""
    state = _get_state(name)
    if state in ("half_open", "open"):
        logger.info(
            "Circuit breaker '%s' → CLOSED (probe succeeded).", name
        )
    _reset(name)


def _on_failure(name: str, config: CircuitConfig, exc: Exception) -> None:
    """Record a failed call. Trip breaker if threshold reached."""
    state = _get_state(name)

    if state == "half_open":
        # Probe failed — re-open immediately without incrementing counter
        _trip(name, config)
        return

    failures = _increment_failures(name, config.redis_ttl)
    logger.warning(
        "Circuit breaker '%s': failure %d/%d — %s: %s",
        name, failures, config.failure_threshold,
        type(exc).__name__, exc,
    )

    if failures >= config.failure_threshold:
        _trip(name, config)


# ── Public decorator ──────────────────────────────────────────────────────────

def circuit_breaker(service_name: str) -> Callable:
    """
    Decorator factory. Wraps an external API call with circuit breaker logic.

    Example
    -------
        @circuit_breaker("paystack")
        def _call_paystack(payload: dict, timeout=None) -> dict:
            return requests.post(..., timeout=timeout).json()

    The wrapped function MUST accept a `timeout` keyword argument.
    The decorator injects the configured call_timeout automatically.

    Raises
    ------
        CircuitOpenError : breaker is OPEN; caller must handle gracefully
        Original exception : breaker is CLOSED/HALF_OPEN but call failed;
                             failure is recorded, exception re-raised
    """
    config = SERVICE_CONFIGS.get(service_name, CircuitConfig())

    def decorator(fn: Callable) -> Callable:
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            if not _should_allow_call(service_name, config):
                raise CircuitOpenError(service_name)

            # Inject call timeout — wrapped functions must accept this kwarg
            kwargs.setdefault("timeout", config.call_timeout)

            try:
                result = fn(*args, **kwargs)
                _on_success(service_name)
                return result
            except CircuitOpenError:
                # Already a circuit error — don't double-count
                raise
            except Exception as exc:
                _on_failure(service_name, config, exc)
                raise  # Re-raise so the service layer can wrap it

        return wrapper
    return decorator


# ── Health status (for admin dashboard) ──────────────────────────────────────

def get_circuit_status() -> dict:
    """
    Return current state of all known circuit breakers.

    Used by the staff-only health dashboard and JSON endpoint.

    Returns
    -------
        {
            "brevo": {
                "state": "closed",
                "failures": 0,
                "failure_threshold": 3,
                "opened_at": None,
                "time_until_probe_seconds": None,
                "call_timeout": 8,
                "recovery_timeout": 60,
            },
            ...
        }
    """
    status = {}
    for name, config in SERVICE_CONFIGS.items():
        state     = _get_state(name)
        failures  = _get_failures(name)
        opened_at = _get_opened_at(name)

        time_until_probe = None
        if state == "open" and opened_at:
            elapsed          = time.time() - opened_at
            time_until_probe = max(0, round(config.recovery_timeout - elapsed))

        status[name] = {
            "state":                    state,
            "failures":                 failures,
            "failure_threshold":        config.failure_threshold,
            "opened_at":                opened_at,
            "time_until_probe_seconds": time_until_probe,
            "call_timeout":             config.call_timeout,
            "recovery_timeout":         config.recovery_timeout,
        }
    return status


def reset_circuit(service_name: str) -> None:
    """
    Manually reset a breaker to CLOSED.
    Callable from admin dashboard or a management command.
    """
    _reset(service_name)
    logger.info("Circuit breaker '%s' manually reset to CLOSED.", service_name)