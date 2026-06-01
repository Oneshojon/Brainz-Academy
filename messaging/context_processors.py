"""
messaging/context_processors.py

Injects `unread_message_count` into every template context.

Registration (examproject/settings.py):
    TEMPLATES[0]['OPTIONS']['context_processors'] = [
        ...
        'messaging.context_processors.unread_message_count',
    ]

The count is served from a 30-second cache keyed per user — the extra
query on every page load is negligible. Anonymous users always get 0.
"""


def unread_message_count(request):
    """
    Return {'unread_message_count': int} for every template render.
    Only queries (or reads cache) for authenticated users.
    """
    if not request.user.is_authenticated:
        return {'unread_message_count': 0}

    from messaging.cache_utils import get_unread_count
    return {'unread_message_count': get_unread_count(request.user.id)}