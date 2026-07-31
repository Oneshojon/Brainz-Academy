"""
contact/views.py

Public Contact Us page. GET renders the page (form + static developer
contact card). POST handles the general Inquiry/Suggestion/Complaint form
via AJAX (JSON in, JSON out) so the frontend can show a spinner and inline
success/error state without a full page reload.

The "Work With the Developer" card is static — direct mailto/LinkedIn/X
links rendered in the template — and has no view logic of its own.
"""

import json
import logging

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_http_methods

from services.email_service import send_contact_notification

from .forms import ContactMessageForm
from .services import get_client_ip, is_rate_limited

logger = logging.getLogger(__name__)


@require_http_methods(["GET", "POST"])
def contact_page(request):
    """
    GET  -> render the Contact Us page
    POST -> validate + save + notify; returns JSON for the AJAX handler
    """
    if request.method == "GET":
        form = ContactMessageForm()
        return render(request, "contact/contact.html", {"form": form})

    try:
        payload = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"success": False, "errors": {"__all__": ["Invalid request."]}}, status=400
        )

    client_ip = get_client_ip(request)

    if is_rate_limited(client_ip):
        logger.warning("Contact form rate limit hit for IP %s", client_ip)
        return JsonResponse(
            {"success": False, "errors": {"__all__": ["Too many submissions. Please try again later."]}},
            status=429,
        )

    form = ContactMessageForm(payload)

    if not form.is_valid():
        if "honeypot" in form.errors:
            # Bots get a fake "success" — there's nothing in the response
            # shape that tells them the honeypot was the tell.
            logger.info("Contact form honeypot triggered from IP %s", client_ip)
            return JsonResponse({"success": True})
        return JsonResponse({"success": False, "errors": form.errors}, status=400)

    contact_message = form.save(commit=False)
    contact_message.ip_address = client_ip
    if request.user.is_authenticated:
        contact_message.user = request.user
    contact_message.save()

    # Email is non-critical: the row above is already committed, so a
    # Brevo outage never loses the submission — it's just not notified
    # immediately. send_contact_notification() handles CircuitOpenError
    # internally and returns False rather than raising.
    send_contact_notification(
        category=contact_message.get_category_display(),
        name=contact_message.name,
        from_email=contact_message.email,
        subject=contact_message.subject,
        message=contact_message.message,
    )

    return JsonResponse({"success": True})