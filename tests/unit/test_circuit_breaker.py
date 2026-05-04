"""
tests/unit/test_circuit_breaker.py

Unit tests for utils.circuit_breaker.

Tests cover:
  - CLOSED state allows calls through
  - Failure counting increments correctly
  - CLOSED → OPEN transition at threshold
  - OPEN state rejects calls immediately (CircuitOpenError)
  - OPEN → HALF_OPEN after cooldown elapses
  - Probe success: HALF_OPEN → CLOSED
  - Probe failure: HALF_OPEN → OPEN immediately
  - Manual reset via reset_circuit()
  - get_circuit_status() returns correct shape

All tests use Django's locmem cache (no real Redis required).
The cache is cleared between tests via setUp.
"""

import time
from unittest.mock import MagicMock, patch

from django.core.cache import cache
from django.test import TestCase

from utils.circuit_breaker import (
    CircuitOpenError,
    _get_failures,
    _get_state,
    _reset,
    _trip,
    circuit_breaker,
    get_circuit_status,
    reset_circuit,
    SERVICE_CONFIGS,
)

# Use a dedicated test service so tests never interfere with real configs
TEST_SERVICE = "test_svc"

# Register a tight config for the test service so tests run fast
from utils.circuit_breaker import SERVICE_CONFIGS, CircuitConfig
SERVICE_CONFIGS[TEST_SERVICE] = CircuitConfig(
    failure_threshold=3,
    recovery_timeout=2,   # 2 seconds — fast enough for tests
    call_timeout=5,
    redis_ttl=60,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_decorated(fn):
    """Apply circuit_breaker decorator to fn for TEST_SERVICE."""
    return circuit_breaker(TEST_SERVICE)(fn)


def _passing_fn(timeout=None):
    """A function that always succeeds."""
    return "ok"


def _failing_fn(timeout=None):
    """A function that always raises."""
    raise ConnectionError("simulated failure")


# ── Tests ─────────────────────────────────────────────────────────────────────

class CircuitBreakerClosedStateTests(TestCase):
    """CLOSED state — normal operation."""

    def setUp(self):
        cache.clear()
        _reset(TEST_SERVICE)

    def test_closed_state_allows_call(self):
        """Call succeeds and returns value when breaker is CLOSED."""
        fn     = _make_decorated(_passing_fn)
        result = fn()
        self.assertEqual(result, "ok")

    def test_closed_state_on_start(self):
        """Breaker starts CLOSED with zero failures."""
        self.assertEqual(_get_state(TEST_SERVICE), "closed")
        self.assertEqual(_get_failures(TEST_SERVICE), 0)

    def test_successful_call_keeps_breaker_closed(self):
        """Multiple successes keep state CLOSED."""
        fn = _make_decorated(_passing_fn)
        for _ in range(5):
            fn()
        self.assertEqual(_get_state(TEST_SERVICE), "closed")

    def test_failure_increments_counter(self):
        """Each failed call increments the failure counter."""
        fn = _make_decorated(_failing_fn)
        for i in range(1, 3):  # below threshold
            with self.assertRaises(ConnectionError):
                fn()
            self.assertEqual(_get_failures(TEST_SERVICE), i)

    def test_state_stays_closed_below_threshold(self):
        """Breaker stays CLOSED while failures are below threshold."""
        fn = _make_decorated(_failing_fn)
        # threshold is 3 — two failures should not trip
        for _ in range(2):
            with self.assertRaises(ConnectionError):
                fn()
        self.assertEqual(_get_state(TEST_SERVICE), "closed")


class CircuitBreakerOpenStateTests(TestCase):
    """CLOSED → OPEN transition and OPEN behaviour."""

    def setUp(self):
        cache.clear()
        _reset(TEST_SERVICE)

    def _trip_breaker(self):
        """Force the breaker OPEN by hitting the failure threshold."""
        fn        = _make_decorated(_failing_fn)
        threshold = SERVICE_CONFIGS[TEST_SERVICE].failure_threshold
        for _ in range(threshold):
            with self.assertRaises(ConnectionError):
                fn()

    def test_trips_open_at_threshold(self):
        """Breaker transitions CLOSED → OPEN after failure_threshold failures."""
        self._trip_breaker()
        self.assertEqual(_get_state(TEST_SERVICE), "open")

    def test_open_state_raises_circuit_open_error(self):
        """OPEN breaker raises CircuitOpenError immediately without calling fn."""
        self._trip_breaker()
        mock_fn = MagicMock(return_value="ok")
        fn      = _make_decorated(mock_fn)

        with self.assertRaises(CircuitOpenError) as ctx:
            fn()

        mock_fn.assert_not_called()   # fn must never be invoked
        self.assertEqual(ctx.exception.service, TEST_SERVICE)

    def test_open_rejects_multiple_calls(self):
        """All subsequent calls in OPEN state are rejected instantly."""
        self._trip_breaker()
        fn = _make_decorated(_passing_fn)
        for _ in range(5):
            with self.assertRaises(CircuitOpenError):
                fn()


class CircuitBreakerHalfOpenTests(TestCase):
    """OPEN → HALF_OPEN → CLOSED / OPEN probe behaviour."""

    def setUp(self):
        cache.clear()
        _reset(TEST_SERVICE)

    def _trip_breaker(self):
        fn        = _make_decorated(_failing_fn)
        threshold = SERVICE_CONFIGS[TEST_SERVICE].failure_threshold
        for _ in range(threshold):
            with self.assertRaises(ConnectionError):
                fn()

    def test_open_transitions_to_half_open_after_cooldown(self):
        """After recovery_timeout elapses, breaker allows one probe (HALF_OPEN)."""
        self._trip_breaker()
        self.assertEqual(_get_state(TEST_SERVICE), "open")

        # Wait for recovery_timeout (2s in test config)
        time.sleep(SERVICE_CONFIGS[TEST_SERVICE].recovery_timeout + 0.1)

        fn = _make_decorated(_passing_fn)
        fn()   # probe call — should succeed

        self.assertEqual(_get_state(TEST_SERVICE), "closed")

    def test_probe_success_resets_to_closed(self):
        """Successful probe after cooldown resets breaker to CLOSED."""
        self._trip_breaker()
        time.sleep(SERVICE_CONFIGS[TEST_SERVICE].recovery_timeout + 0.1)

        fn = _make_decorated(_passing_fn)
        fn()

        self.assertEqual(_get_state(TEST_SERVICE), "closed")
        self.assertEqual(_get_failures(TEST_SERVICE), 0)

    def test_probe_failure_reopens_immediately(self):
        """Failed probe after cooldown re-opens the breaker immediately."""
        self._trip_breaker()
        time.sleep(SERVICE_CONFIGS[TEST_SERVICE].recovery_timeout + 0.1)

        fn = _make_decorated(_failing_fn)
        with self.assertRaises(ConnectionError):
            fn()

        self.assertEqual(_get_state(TEST_SERVICE), "open")


class CircuitBreakerResetTests(TestCase):
    """Manual reset via reset_circuit()."""

    def setUp(self):
        cache.clear()
        _reset(TEST_SERVICE)

    def test_reset_clears_open_state(self):
        """reset_circuit() transitions OPEN → CLOSED."""
        _trip(TEST_SERVICE, SERVICE_CONFIGS[TEST_SERVICE])
        self.assertEqual(_get_state(TEST_SERVICE), "open")

        reset_circuit(TEST_SERVICE)
        self.assertEqual(_get_state(TEST_SERVICE), "closed")

    def test_reset_clears_failure_count(self):
        """reset_circuit() zeroes the failure counter."""
        fn = _make_decorated(_failing_fn)
        with self.assertRaises(ConnectionError):
            fn()

        reset_circuit(TEST_SERVICE)
        self.assertEqual(_get_failures(TEST_SERVICE), 0)

    def test_calls_succeed_after_reset(self):
        """Calls go through normally after manual reset."""
        _trip(TEST_SERVICE, SERVICE_CONFIGS[TEST_SERVICE])
        reset_circuit(TEST_SERVICE)

        fn     = _make_decorated(_passing_fn)
        result = fn()
        self.assertEqual(result, "ok")


class CircuitBreakerStatusTests(TestCase):
    """get_circuit_status() shape and values."""

    def setUp(self):
        cache.clear()
        _reset(TEST_SERVICE)

    def test_status_contains_all_known_services(self):
        """get_circuit_status() returns an entry for every service in SERVICE_CONFIGS."""
        status = get_circuit_status()
        for name in SERVICE_CONFIGS:
            self.assertIn(name, status)

    def test_status_closed_service_shape(self):
        """CLOSED service entry has the expected keys and values."""
        status  = get_circuit_status()
        service = status.get(TEST_SERVICE)
        self.assertIsNotNone(service)
        self.assertEqual(service['state'],    'closed')
        self.assertEqual(service['failures'], 0)
        self.assertIsNone(service['opened_at'])
        self.assertIsNone(service['time_until_probe_seconds'])
        self.assertIn('failure_threshold', service)
        self.assertIn('call_timeout',      service)
        self.assertIn('recovery_timeout',  service)

    def test_status_open_service_has_countdown(self):
        """OPEN service entry has a non-None time_until_probe_seconds."""
        _trip(TEST_SERVICE, SERVICE_CONFIGS[TEST_SERVICE])
        status  = get_circuit_status()
        service = status[TEST_SERVICE]
        self.assertEqual(service['state'], 'open')
        self.assertIsNotNone(service['time_until_probe_seconds'])
        self.assertGreaterEqual(service['time_until_probe_seconds'], 0)