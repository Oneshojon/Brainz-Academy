# ══════════════════════════════════════════════════════════════════════════════
# catalog/cache_utils.py  — central place for all cache keys and helpers
# ══════════════════════════════════════════════════════════════════════════════
from django.core.cache import cache


# ── Cache timeout constants ───────────────────────────────────────────────────
CACHE_1_MIN   = 60
CACHE_5_MIN   = 60 * 5
CACHE_15_MIN  = 60 * 15
CACHE_1_HOUR  = 60 * 60
CACHE_24_HOUR = 60 * 60 * 24


# ── Cache key constants ───────────────────────────────────────────────────────
KEY_ALL_SUBJECTS   = 'catalog:subjects:all'
KEY_ALL_BOARDS     = 'catalog:boards:all'
KEY_THEMES         = 'catalog:themes:subject:{subject_id}'
KEY_TOPICS         = 'catalog:topics:subject:{subject_id}'
KEY_TOPICS_THEME   = 'catalog:topics:theme:{theme_id}'
KEY_FEATURE_FLAGS  = 'catalog:feature_flags:all'
KEY_LEADERBOARD    = 'practice:leaderboard:top50'
KEY_AVAILABLE_YEARS = 'catalog:years:subject:{subject_id}:board:{board_id}'


# ── Generic helpers ───────────────────────────────────────────────────────────

def get_or_set(key, queryset_fn, timeout):
    """
    Try to get from cache. If miss, call queryset_fn(), store and return result.
    
    Usage:
        subjects = get_or_set(
            KEY_ALL_SUBJECTS,
            lambda: list(Subject.objects.all()),
            CACHE_24_HOUR
        )
    """
    result = cache.get(key)
    if result is None:
        result = queryset_fn()
        cache.set(key, result, timeout)
    return result


def invalidate(*keys):
    """Delete one or more cache keys."""
    cache.delete_many(keys)


# ── Subject helpers ───────────────────────────────────────────────────────────

def get_all_subjects():
    from catalog.models import Subject
    return get_or_set(
        KEY_ALL_SUBJECTS,
        lambda: list(Subject.objects.all().order_by('name')),
        CACHE_24_HOUR
    )


def get_all_boards():
    from catalog.models import ExamBoard
    return get_or_set(
        KEY_ALL_BOARDS,
        lambda: list(ExamBoard.objects.all().order_by('name')),
        CACHE_24_HOUR
    )


def get_themes_for_subject(subject_id):
    from catalog.models import Theme
    key = KEY_THEMES.format(subject_id=subject_id)
    return get_or_set(
        key,
        lambda: list(Theme.objects.filter(subject_id=subject_id).order_by('order', 'name')),
        CACHE_1_HOUR
    )


def get_topics_for_subject(subject_id):
    from catalog.models import Topic
    key = KEY_TOPICS.format(subject_id=subject_id)
    return get_or_set(
        key,
        lambda: list(Topic.objects.filter(subject_id=subject_id).order_by('name')),
        CACHE_1_HOUR
    )


def get_topics_for_theme(theme_id):
    from catalog.models import Topic
    key = KEY_TOPICS_THEME.format(theme_id=theme_id)
    return get_or_set(
        key,
        lambda: list(Topic.objects.filter(theme_id=theme_id).order_by('name')),
        CACHE_1_HOUR
    )


def get_available_years(subject_id, board_id):
    from catalog.models import ExamSeries
    key = KEY_AVAILABLE_YEARS.format(subject_id=subject_id or 'all', board_id=board_id or 'all')
    def _fetch():
        qs = ExamSeries.objects.all()
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if board_id:
            qs = qs.filter(exam_board_id=board_id)
        return sorted(qs.values_list('year', flat=True).distinct())
    return get_or_set(key, _fetch, CACHE_1_HOUR)


# ── Feature flags ─────────────────────────────────────────────────────────────

def get_feature_flags():
    from catalog.models import FeatureFlag
    return get_or_set(
        KEY_FEATURE_FLAGS,
        lambda: {
            f.key: {'enabled': f.is_enabled, 'visible_to': f.visible_to}
            for f in FeatureFlag.objects.all()
        },
        CACHE_5_MIN
    )


def invalidate_feature_flags():
    """Call this after toggling a feature flag."""
    invalidate(KEY_FEATURE_FLAGS)


# ── Leaderboard ───────────────────────────────────────────────────────────────

def get_leaderboard():
    """Returns top 50 leaderboard entries. Slightly stale is acceptable."""
    from django.db.models import Count, Avg, F, FloatField, ExpressionWrapper
    from practice.models import PracticeSession
    def _fetch():
        return list(
            PracticeSession.objects.filter(
                completed_at__isnull=False,
                total_marks__gt=0
            ).values(
                'user__id', 'user__first_name', 'user__email'
            ).annotate(
                session_count=Count('id'),
                avg_score=Avg(
                    ExpressionWrapper(
                        F('score') * 100.0 / F('total_marks'),
                        output_field=FloatField()
                    )
                )
            ).order_by('-avg_score')[:50]
        )
    return get_or_set(KEY_LEADERBOARD, _fetch, CACHE_15_MIN)


def invalidate_leaderboard():
    """Call after a session is completed."""
    invalidate(KEY_LEADERBOARD)


# ── Invalidation helpers (call on data change) ────────────────────────────────

def invalidate_subject_caches(subject_id=None):
    """
    Call after adding/editing a subject, topic, theme, or exam series.
    If subject_id provided, only invalidates that subject's caches.
    Otherwise invalidates all subject-related caches.
    """
    keys = [KEY_ALL_SUBJECTS, KEY_ALL_BOARDS]
    if subject_id:
        keys += [
            KEY_THEMES.format(subject_id=subject_id),
            KEY_TOPICS.format(subject_id=subject_id),
            KEY_AVAILABLE_YEARS.format(subject_id=subject_id, board_id='all'),
        ]
    invalidate(*keys)