"""
schools/frontend_views.py

Serves the School Plan React SPA shell. Deliberately NOT @login_required —
the pricing page (GET /schools/plans/) is public per the API contract.
Auth-gated pages (register, admin) are gated client-side: the template
hands the SPA `window.IS_AUTHENTICATED` up front so it can redirect to
login without waiting on a failed API call first, and the API itself
still enforces auth/role server-side regardless of what the client does.
"""

from django.shortcuts import render


def index(request, subpath=None):
    """Render the School Plan SPA shell for any /school-plan/* path."""
    return render(request, 'schools/index.html')