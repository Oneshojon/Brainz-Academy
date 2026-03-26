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
    from django.core.cache import cache
    from catalog.models import FeatureFlag
    from catalog.cache_utils import KEY_FEATURE_FLAGS

    flags = cache.get(KEY_FEATURE_FLAGS)
    if flags is None:
        flags = {
            f.key: {'enabled': f.is_enabled, 'visible_to': f.visible_to}
            for f in FeatureFlag.objects.all()
        }
        cache.set(KEY_FEATURE_FLAGS, flags, 300)

    flag = flags.get(key)
    if flag is None:
        return True
    if not flag['enabled']:
        return False
    if user and flag['visible_to'] != 'ALL':
        role = getattr(user, 'role', None)
        if role and role != flag['visible_to']:
            return False
    return True

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