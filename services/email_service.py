"""
services/email_service.py

All outbound email for BrainzAcademy goes through this module.
Views must never call django.core.mail or anymail directly.

Why
---
- Circuit breaker protection: Brevo down → fast fail → clear user message
- Single place to swap provider (Brevo → SES) with zero view changes
- Consistent logging across all email types
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

from utils.circuit_breaker import CircuitOpenError, circuit_breaker

logger = logging.getLogger(__name__)


# ── Internal sender (circuit-breaker-protected) ───────────────────────────────

@circuit_breaker("brevo")
def _send_mail(
    subject: str,
    body_text: str,
    body_html: str,
    to: list[str],
    timeout=None,   # injected by circuit_breaker decorator; not used directly
) -> None:          # but MUST be present so the decorator can set the default
    """
    Low-level send via django-anymail → Brevo.

    `timeout` is injected by the circuit breaker decorator. Anymail's actual
    HTTP timeout is controlled via ANYMAIL["REQUESTS_TIMEOUT"] in settings.py
    which should match the call_timeout set in CircuitConfig for "brevo" (8s).
    The decorator kwarg exists so the breaker can track the intent.
    """
    msg = EmailMultiAlternatives(
        subject=subject,
        body=body_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=to,
    )
    if body_html:
        msg.attach_alternative(body_html, "text/html")
    msg.send(fail_silently=False)


# ── Public API ────────────────────────────────────────────────────────────────

def send_otp_email(to_email: str, otp_code: str) -> bool:
    """
    Send a one-time password email for login.

    Returns True on success, False if the circuit is OPEN or delivery fails.
    The view must check the return value and show a user-facing message on False.

    Args:
        to_email  : recipient email address
        otp_code  : 6-digit OTP string
    """
    subject   = "BrainzAcademy Login Code"
    body_text = (
        f"Your BrainzAcademy login code is: {otp_code}\n\n"
        f"This code expires in 10 minutes. Do not share it with anyone."
    )
    body_html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#0B2D72;margin-bottom:8px">Your Login Code</h2>
      <p style="color:#444;margin-bottom:20px">
        Use the code below to log in to BrainzAcademy.
        It expires in <strong>10 minutes</strong>.
      </p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                  color:#0992C2;padding:16px 0;border-top:2px solid #0AC4E0;
                  border-bottom:2px solid #0AC4E0;margin-bottom:20px">
        {otp_code}
      </div>
      <p style="color:#888;font-size:13px">
        If you did not request this code, you can safely ignore this email.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px">
      <small style="color:#aaa">
        BrainzAcademy · Nigeria's #1 WAEC, NECO &amp; JAMB prep platform
      </small>
    </div>
    """
    try:
        _send_mail(
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            to=[to_email],
        )
        logger.info("OTP email sent to %s", to_email)
        return True

    except CircuitOpenError:
        logger.error(
            "OTP email NOT sent to %s — Brevo circuit is OPEN.", to_email
        )
        return False

    except Exception as exc:
        logger.error("OTP email delivery failed for %s: %s", to_email, exc)
        return False


def send_subscription_confirmation(
    to_email: str,
    user_name: str,
    plan_name: str,
    expiry_date: str,
) -> bool:
    """
    Send subscription activation confirmation email.
    Non-critical — subscription is active regardless of email delivery.

    Returns True on success, False on any failure (logged, not raised).
    """
    subject   = f"You're subscribed to BrainzAcademy {plan_name} 🎉"
    body_text = (
        f"Hi {user_name},\n\n"
        f"Your {plan_name} subscription is now active until {expiry_date}.\n\n"
        f"Log in and start practising: https://brainzacademy.com\n\n"
        f"— The BrainzAcademy Team"
    )
    body_html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="color:#0B2D72">You're subscribed! 🎉</h2>
      <p>Hi {user_name},</p>
      <p>Your <strong>{plan_name}</strong> subscription is now active.</p>
      <p>Valid until: <strong>{expiry_date}</strong></p>
      <a href="https://brainzacademy.com"
         style="display:inline-block;margin-top:16px;padding:12px 24px;
                background:#0992C2;color:#fff;border-radius:6px;
                text-decoration:none;font-weight:bold">
        Start Practising →
      </a>
      <hr style="border:none;border-top:1px solid #eee;margin-top:24px">
      <small style="color:#aaa">BrainzAcademy · brainzacademy.com</small>
    </div>
    """
    try:
        _send_mail(
            subject=subject,
            body_text=body_text,
            body_html=body_html,
            to=[to_email],
        )
        logger.info("Subscription confirmation sent to %s", to_email)
        return True

    except (CircuitOpenError, Exception) as exc:
        # Non-critical — log and continue; subscription is already activated
        logger.error(
            "Subscription confirmation email failed for %s: %s", to_email, exc
        )
        return False