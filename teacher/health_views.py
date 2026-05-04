"""
teacher/health_views.py

Staff-only circuit breaker health dashboard.
Accessible at /admin/health/

Views
-----
  health_dashboard    GET  -- HTML dashboard with colour-coded breaker cards
  health_status_json  GET  -- JSON endpoint for monitoring scripts
  reset_circuit_view  POST -- manually reset a named circuit to CLOSED
"""

import json
import logging

from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_POST

from utils.circuit_breaker import get_circuit_status, reset_circuit

logger = logging.getLogger(__name__)


@staff_member_required
def health_dashboard(request):
    """Render the circuit breaker health dashboard (staff only)."""
    circuit_status = get_circuit_status()
    return render(request, "teacher/health_dashboard.html", {
        "circuit_status": circuit_status,
    })


@staff_member_required
def health_status_json(request):
    """
    JSON endpoint for monitoring scripts or uptime tools.
    Returns current state of all circuit breakers.
    """
    return JsonResponse(get_circuit_status())


@staff_member_required
@require_POST
def reset_circuit_view(request):
    """
    Manually reset a circuit breaker to CLOSED.
    POST body: { "service": "brevo" }
    """
    try:
        body    = json.loads(request.body)
        service = body.get("service", "").strip()
    except (json.JSONDecodeError, AttributeError):
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    if not service:
        return JsonResponse({"error": "Missing service field"}, status=400)

    reset_circuit(service)
    logger.info(
        "Circuit '%s' manually reset by staff user %s.",
        service, request.user.email,
    )
    return JsonResponse({"success": True, "service": service, "new_state": "closed"})