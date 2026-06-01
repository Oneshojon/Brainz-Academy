"""
messaging/recipients.py

Single public function: resolve_recipients(filter_params) → QuerySet[CustomUser]

Returns a queryset (not a list) so callers can:
  - Call .count() cheaply for the preview endpoint (no data transfer)
  - Call .iterator() for bulk receipt creation without loading all rows

Filter params dict shape
────────────────────────
{
    "audience": "ALL" | "STUDENTS" | "TEACHERS",

    # Students only — both optional, both inclusive (≥)
    "min_total_sessions":  int | None,
    "min_recent_sessions": int | None,   # completed sessions in last 30 days

    # Teachers only — optional
    "subject_id": int | None,            # teachers who built tests for this subject
}

Query design — no N+1
─────────────────────
Student filters use a single annotated queryset with two conditional Count
expressions sharing one JOIN, resolved in a single SQL query.

Teacher-by-subject uses SavedTest → SavedTestQuestion → Question → Subject,
annotated and filtered in one query.
"""

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone


def resolve_recipients(filter_params: dict):
    """
    Resolve a recipient queryset from filter_params.

    Always excludes inactive users and admin accounts to avoid sending
    platform messages to internal accounts.

    Returns a QuerySet[CustomUser] — never evaluated here.
    """
    from Users.models import CustomUser

    audience    = filter_params.get('audience', 'ALL')
    min_total   = filter_params.get('min_total_sessions')
    min_recent  = filter_params.get('min_recent_sessions')
    subject_id  = filter_params.get('subject_id')

    # Base: active non-admin users only
    qs = CustomUser.objects.filter(is_active=True, is_admin=False)

    # ── Audience filter ───────────────────────────────────────────────────────
    if audience == 'STUDENTS':
        qs = qs.filter(role='STUDENT')
    elif audience == 'TEACHERS':
        qs = qs.filter(role='TEACHER')
    # 'ALL' — no role filter

    # ── Student session filters ───────────────────────────────────────────────
    # Both filters share a single annotation pass — one SQL query.
    # We only annotate when needed to keep the query lean for simple cases.
    if audience in ('STUDENTS', 'ALL') and (min_total or min_recent):
        thirty_days_ago  = timezone.now() - timedelta(days=30)
        annotate_kwargs  = {}

        if min_total is not None:
            annotate_kwargs['total_sessions'] = Count(
                'practice_sessions',
                filter=Q(practice_sessions__completed_at__isnull=False),
                distinct=True,
            )

        if min_recent is not None:
            annotate_kwargs['recent_sessions'] = Count(
                'practice_sessions',
                filter=Q(
                    practice_sessions__completed_at__isnull=False,
                    practice_sessions__completed_at__gte=thirty_days_ago,
                ),
                distinct=True,
            )

        if annotate_kwargs:
            qs = qs.annotate(**annotate_kwargs)
            if min_total is not None:
                qs = qs.filter(total_sessions__gte=min_total)
            if min_recent is not None:
                qs = qs.filter(recent_sessions__gte=min_recent)

    # ── Teacher subject filter ────────────────────────────────────────────────
    # Identifies teachers who have used the test builder for the given subject.
    # Path: SavedTest → SavedTestQuestion → Question → Subject — one query.
    if subject_id and audience in ('TEACHERS', 'ALL'):
        teacher_ids = (
            CustomUser.objects
            .filter(
                role='TEACHER',
                saved_tests__test_questions__question__subject_id=subject_id,
            )
            .values_list('id', flat=True)
            .distinct()
        )
        if audience == 'ALL':
            qs = qs.filter(Q(role='STUDENT') | Q(id__in=teacher_ids))
        else:
            qs = qs.filter(id__in=teacher_ids)

    return qs.distinct()


def describe_filter(filter_params: dict) -> str:
    """
    Return a human-readable summary of the filter for the history card.

    Example: "All Students · min 5 total sessions · min 2 recent sessions"
    Pure Python after the optional Subject lookup — no extra queries in loops.
    """
    from catalog.models import Subject

    audience   = filter_params.get('audience', 'ALL')
    min_total  = filter_params.get('min_total_sessions')
    min_recent = filter_params.get('min_recent_sessions')
    subject_id = filter_params.get('subject_id')

    label_map = {
        'ALL':      'All Users',
        'STUDENTS': 'All Students',
        'TEACHERS': 'All Teachers',
    }
    parts = [label_map.get(audience, audience)]

    if min_total:
        parts.append(f"min {min_total} total session{'s' if min_total != 1 else ''}")
    if min_recent:
        parts.append(f"min {min_recent} recent session{'s' if min_recent != 1 else ''} (30 days)")
    if subject_id:
        try:
            subj = Subject.objects.only('name').get(id=subject_id)
            parts.append(f'test builder subject: {subj.name}')
        except Subject.DoesNotExist:
            parts.append(f'subject #{subject_id}')

    return ' · '.join(parts)