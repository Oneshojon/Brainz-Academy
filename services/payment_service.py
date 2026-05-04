"""
services/payment_service.py

All outbound Paystack API calls for BrainzAcademy go through this module.
Views must never import `requests` and call Paystack directly.

Why
---
- Circuit breaker protection: Paystack slow → fast fail → clear user message
- HMAC webhook verification centralised here
- Easy provider swap with zero view changes
"""

import hashlib
import hmac
import logging

import requests
from django.conf import settings

from utils.circuit_breaker import CircuitOpenError, circuit_breaker

logger = logging.getLogger(__name__)

PAYSTACK_BASE = "https://api.paystack.co"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type":  "application/json",
    }


# ── Custom exceptions ─────────────────────────────────────────────────────────

class PaystackError(Exception):
    """Paystack returned a well-formed error response."""
    pass


class PaystackUnavailableError(Exception):
    """
    Paystack circuit is OPEN or the request timed out.
    Views must catch this and show a user-friendly retry message.
    """
    pass


# ── Circuit-breaker-protected HTTP calls ──────────────────────────────────────

@circuit_breaker("paystack")
def _post(endpoint: str, payload: dict, timeout=None) -> dict:
    """POST to Paystack. `timeout` injected by circuit breaker decorator."""
    response = requests.post(
        f"{PAYSTACK_BASE}{endpoint}",
        json=payload,
        headers=_headers(),
        timeout=timeout,
    )
    response.raise_for_status()
    return response.json()


@circuit_breaker("paystack")
def _get(endpoint: str, timeout=None) -> dict:
    """GET from Paystack. `timeout` injected by circuit breaker decorator."""
    response = requests.get(
        f"{PAYSTACK_BASE}{endpoint}",
        headers=_headers(),
        timeout=timeout,
    )
    response.raise_for_status()
    return response.json()


# ── Public API ────────────────────────────────────────────────────────────────

def initialize_transaction(
    email: str,
    amount_kobo: int,
    callback_url: str,
    metadata: dict = None,
) -> str:
    """
    Initialize a Paystack transaction and return the authorization URL.

    Args:
        email        : customer email
        amount_kobo  : amount in kobo (Naira × 100)
        callback_url : URL Paystack redirects to after payment
        metadata     : optional dict (user_id, plan_id, etc.)

    Returns:
        authorization_url : Paystack-hosted checkout page URL

    Raises:
        PaystackUnavailableError : circuit OPEN or request timed out
        PaystackError            : Paystack returned an error response
    """
    payload = {
        "email":        email,
        "amount":       amount_kobo,
        "currency":     "NGN",
        "callback_url": callback_url,
        "metadata":     metadata or {},
    }
    try:
        data = _post("/transaction/initialize", payload)
        if not data.get("status"):
            raise PaystackError(
                data.get("message", "Paystack initialization failed.")
            )
        return data["data"]["authorization_url"]

    except CircuitOpenError:
        raise PaystackUnavailableError(
            "Payment service is temporarily unavailable. "
            "Please try again in a moment."
        )
    except requests.Timeout:
        raise PaystackUnavailableError(
            "Payment gateway timed out. Please try again."
        )
    except requests.HTTPError as exc:
        raise PaystackError(f"Paystack HTTP error: {exc}")


def verify_transaction(reference: str) -> dict:
    """
    Verify a transaction by reference after the user returns from Paystack.

    Args:
        reference : the transaction reference from ?reference= callback param

    Returns:
        Full transaction data dict from Paystack on success.

    Raises:
        PaystackUnavailableError : circuit OPEN or request timed out
        PaystackError            : verification failed or payment not successful
    """
    try:
        data = _get(f"/transaction/verify/{reference}")
        if not data.get("status"):
            raise PaystackError(
                data.get("message", "Transaction verification failed.")
            )

        tx = data["data"]
        if tx.get("status") != "success":
            raise PaystackError(
                f"Payment not successful. Paystack status: {tx.get('status')}"
            )
        return tx

    except CircuitOpenError:
        raise PaystackUnavailableError(
            "Could not verify payment — service temporarily unavailable. "
            "Your payment is safe. If your subscription is not activated "
            "within 5 minutes, please contact support."
        )
    except requests.Timeout:
        raise PaystackUnavailableError(
            "Payment verification timed out. Please contact support if your "
            "subscription was not activated."
        )
    except requests.HTTPError as exc:
        raise PaystackError(f"Paystack verification HTTP error: {exc}")


def verify_webhook_signature(payload_bytes: bytes, paystack_signature: str) -> bool:
    """
    Verify Paystack webhook HMAC-SHA512 signature.
    Must be called before processing any webhook event.

    Args:
        payload_bytes      : raw request.body (bytes, not decoded)
        paystack_signature : value of X-Paystack-Signature header

    Returns:
        True if signature is valid, False otherwise.
    """
    if not paystack_signature:
        return False

    computed = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode("utf-8"),
        payload_bytes,
        hashlib.sha512,
    ).hexdigest()

    return hmac.compare_digest(computed, paystack_signature)