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
KEY_TOPICS_THEME_BOARD = 'catalog:topics:theme:{theme_id}:board:{board_id}'
KEY_FEATURE_FLAGS  = 'catalog:feature_flags:all'
KEY_LEADERBOARD    = 'practice:leaderboard:top50'
KEY_AVAILABLE_YEARS = 'catalog:years:subject:{subject_id}:board:{board_id}'
KEY_SUBJECTS_WITH_COUNTS = 'catalog:subjects:with_counts'
KEY_BOARDS_WITH_QUESTION_COUNTS = 'catalog:boards:with_question_counts'
KEY_AVAILABLE_SITTINGS = 'catalog:sittings:subject:{subject_id}:board:{board_id}:year:{year}'
KEY_PLATFORM_SETTINGS = 'catalog:platform_settings'

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

def get_available_sittings(subject_id, board_id, year):
    from catalog.models import ExamSeries
    key = KEY_AVAILABLE_SITTINGS.format(
        subject_id=subject_id or 'all',
        board_id=board_id or 'all',
        year=year or 'all'
    )
    def _fetch():
        qs = ExamSeries.objects.filter(questions__isnull=False).distinct()  # ← questions not question
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if board_id:
            qs = qs.filter(exam_board_id=board_id)
        if year:
            qs = qs.filter(year=year)
        return sorted(qs.values_list('sitting', flat=True).distinct())
    return get_or_set(key, _fetch, CACHE_1_HOUR)

def get_all_subjects():
    from catalog.models import Subject
    return get_or_set(
        KEY_ALL_SUBJECTS,
        lambda: list(Subject.objects.all().order_by('name')),
        CACHE_24_HOUR
    )

def get_subjects_with_question_counts():
    from catalog.models import Subject
    from django.db.models import Count
    return get_or_set(
        KEY_SUBJECTS_WITH_COUNTS,
        lambda: list(
            Subject.objects
            .annotate(question_count=Count('questions', distinct=True))
            .filter(question_count__gt=0)
            .order_by('name')
        ),
        CACHE_1_HOUR    # ← 1 hour, not 24, since counts change on upload
    )

def get_all_boards():
    from catalog.models import ExamBoard
    return get_or_set(
        KEY_ALL_BOARDS,
        lambda: list(ExamBoard.objects.all().order_by('name')),
        CACHE_24_HOUR
    )


# ── Student performance ───────────────────────────────────────────────────────

KEY_STUDENT_STATS     = 'teacher:student_stats:subject:{subject_id}'
KEY_STUDENT_STATS_ALL = 'teacher:student_stats:known_keys'


def get_student_stats(subject_id=None):
    from Users.models import CustomUser
    from practice.models import PracticeSession
    from django.db.models import Avg, Count, ExpressionWrapper, F, FloatField, OuterRef, Q, Subquery

    key = KEY_STUDENT_STATS.format(subject_id=subject_id or 'all')

    # Track this key so invalidation can find all subject variants
    known = cache.get(KEY_STUDENT_STATS_ALL) or []
    if key not in known:
        cache.set(KEY_STUDENT_STATS_ALL, known + [key], CACHE_24_HOUR)

    def _fetch():
        session_filter = {'completed_at__isnull': False}
        if subject_id:
            session_filter['subject_id'] = subject_id

        ps_filter = {f'practice_sessions__{k}': v for k, v in session_filter.items()}

        last_active_sq = (
            PracticeSession.objects
            .filter(user=OuterRef('pk'), **session_filter)
            .order_by('-completed_at')
            .values('completed_at')[:1]
        )

        return list(
            CustomUser.objects
            .filter(role='STUDENT')
            .annotate(
                session_count=Count('practice_sessions', filter=Q(**ps_filter)),
                avg_score=Avg(
                    ExpressionWrapper(
                        F('practice_sessions__score') * 100.0 / F('practice_sessions__total_marks'),
                        output_field=FloatField(),
                    ),
                    filter=Q(**ps_filter, practice_sessions__total_marks__gt=0),
                ),
                last_active=Subquery(last_active_sq),
            )
            .order_by(F('avg_score').desc(nulls_last=True))
            .only('id', 'first_name', 'last_name', 'streak')
        )

    return get_or_set(key, _fetch, CACHE_5_MIN)


def invalidate_student_stats():
    """Invalidates all subject-filtered variants. Safe for locmem."""
    known_keys = cache.get(KEY_STUDENT_STATS_ALL) or []
    invalidate(*set(known_keys), KEY_STUDENT_STATS_ALL)

def get_themes_for_subject(subject_id):
    from catalog.models import Theme
    from django.db.models import Count
    key = KEY_THEMES.format(subject_id=subject_id)
    return get_or_set(
        key,
        lambda: list(
            Theme.objects
            .filter(subject_id=subject_id)
            .annotate(topic_count=Count('topics'))
            .order_by('order', 'name')
        ),
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
    keys = [KEY_ALL_SUBJECTS, KEY_ALL_BOARDS, KEY_SUBJECTS_WITH_COUNTS, KEY_BOARDS_WITH_QUESTION_COUNTS]
    if subject_id:
        keys += [
            KEY_THEMES.format(subject_id=subject_id),
            KEY_TOPICS.format(subject_id=subject_id),
            KEY_AVAILABLE_YEARS.format(subject_id=subject_id, board_id='all'),
            KEY_AVAILABLE_SITTINGS.format(subject_id=subject_id, board_id='all', year='all'),
        ]
    invalidate(*keys)


def get_topics_for_theme_with_counts(theme_id, exam_board_id=None):
    from catalog.models import Topic
    from django.db.models import Count, Q

    key = KEY_TOPICS_THEME_BOARD.format(
        theme_id=theme_id,
        board_id=exam_board_id or 'all'
    )

    def _fetch():
        count_filter = (
            Q(questions__exam_series__exam_board_id=exam_board_id)
            if exam_board_id else Q()
        )
        topics = (
            Topic.objects
            .filter(theme_id=theme_id)
            .annotate(question_count=Count('questions', filter=count_filter, distinct=True))
            .order_by('name')
        )
        return [
            {
                'id': t.id,
                'name': t.name,
                'subject': t.subject_id,
                'question_count': t.question_count,
            }
            for t in topics
        ]

    return get_or_set(key, _fetch, CACHE_1_HOUR)


def get_boards_with_question_counts():
    from catalog.models import ExamBoard
    from django.db.models import Count
    return get_or_set(
        KEY_BOARDS_WITH_QUESTION_COUNTS,
        lambda: list(
            ExamBoard.objects
            .annotate(question_count=Count('series__questions', distinct=True))
            .filter(question_count__gt=0)
            .order_by('name')
        ),
        CACHE_1_HOUR
    )

def get_platform_settings():
    """
    Returns the cached PlatformSettings singleton.
    Use this everywhere instead of PlatformSettings.get() to avoid DB hits.
    Cache is busted automatically via the post_save signal on PlatformSettings.
    """
    from catalog.models import PlatformSettings
    # return get_or_set(
    #     KEY_PLATFORM_SETTINGS,
    #     lambda: PlatformSettings.get(),
    #     CACHE_5_MIN
    # )
    return PlatformSettings.get()


def invalidate_platform_settings():
    """Called by the PlatformSettings post_save signal."""
    invalidate(KEY_PLATFORM_SETTINGS)