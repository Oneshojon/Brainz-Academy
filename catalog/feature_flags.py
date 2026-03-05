"""
Feature flag helpers used across the whole project.

1. is_feature_enabled(key, user=None) — check a flag in Python
2. @feature_required('key')           — view decorator
3. {% load feature_tags %}            — template tag (see FILE 2 below)
4. context_processor                  — injects all flags into every template
"""

from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages


def is_feature_enabled(key, user=None):
    """
    Returns True if the feature flag 'key' is enabled for the given user.
    Falls back to True if the flag doesn't exist yet (safe default).
    Caches nothing — always reads from DB (add caching later if needed).
    """
    from catalog.models import FeatureFlag   # avoid circular import
    try:
        flag = FeatureFlag.objects.get(key=key)
        if not flag.is_enabled:
            return False
        # If scoped to a role, check the user's role
        if user and flag.visible_to != 'ALL':
            role = getattr(user, 'role', None)
            if role and role != flag.visible_to:
                return False
        return True
    except FeatureFlag.DoesNotExist:
        return True   # unknown flag → don't block


def feature_required(key, redirect_to=None):
    """
    View decorator. Redirects to dashboard with a message if the feature is off.

    @feature_required('lesson_notes')
    def lesson_notes(request):
        ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not is_feature_enabled(key, user=request.user):
                messages.warning(
                    request,
                    "This feature is currently unavailable. Please check back later."
                )
                url = redirect_to or _guess_dashboard(request.user)
                return redirect(url)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def _guess_dashboard(user):
    role = getattr(user, 'role', None)
    if role == 'TEACHER':
        return '/teacher/'
    return '/dashboard/'