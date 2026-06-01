"""
messaging/cache_utils.py

Thin cache layer for the messaging app.
Only the per-user unread count is cached — it hits every page via the
context processor and is the only call that warrants caching.

All other messaging queries (inbox list, history) are admin-only or
low-frequency and are always served fresh.
"""

from django.core.cache import cache

# Short TTL: unread count must feel real-time.
# 30 s absorbs repeated page loads without stale counts persisting.
CACHE_UNREAD_TTL = 30

KEY_UNREAD_COUNT = 'messaging:unread:{user_id}'


def get_unread_count(user_id: int) -> int:
    """
    Return the number of unread MessageReceipt rows for this user.
    Result is cached for CACHE_UNREAD_TTL seconds.

    Called by the context processor on every authenticated page load.
    """
    from messaging.models import MessageReceipt

    key    = KEY_UNREAD_COUNT.format(user_id=user_id)
    cached = cache.get(key)
    if cached is None:
        cached = MessageReceipt.objects.filter(
            recipient_id=user_id,
            is_read=False,
        ).count()
        cache.set(key, cached, CACHE_UNREAD_TTL)
    return cached


def invalidate_unread_count(user_id: int) -> None:
    """
    Bust the cached unread count for a single user.

    Call after:
      - A new MessageReceipt is created for this user (new broadcast)
      - The user marks one or all messages as read
    """
    cache.delete(KEY_UNREAD_COUNT.format(user_id=user_id))


def invalidate_unread_count_bulk(user_ids) -> None:
    """
    Bust unread-count cache for multiple users at once.
    Called after bulk_create of MessageReceipt rows in the send view.

    user_ids: any iterable of int
    """
    keys = [KEY_UNREAD_COUNT.format(user_id=uid) for uid in user_ids]
    if keys:
        cache.delete_many(keys)