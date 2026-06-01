"""
tests/unit/test_messaging_recipients.py

Unit tests for messaging.recipients.resolve_recipients().

Covers:
  - ALL / STUDENTS / TEACHERS audience filtering
  - min_total_sessions filter
  - min_recent_sessions filter (last 30 days)
  - subject_id teacher filter (SavedTest → Question → Subject)
  - Inactive users excluded
  - Admin users excluded
  - No duplicate rows (.distinct() guard)
  - Empty filter_params defaults to ALL
"""

import pytest
from datetime import timedelta

from django.utils import timezone

from messaging.recipients import resolve_recipients


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def student(db, django_user_model):
    return django_user_model.objects.create_user(
        email='student@test.com', password='pass',
        role='STUDENT', is_active=True, is_admin=False,
        first_name='Ada', last_name='Obi',
    )


@pytest.fixture
def student2(db, django_user_model):
    return django_user_model.objects.create_user(
        email='student2@test.com', password='pass',
        role='STUDENT', is_active=True, is_admin=False,
    )


@pytest.fixture
def teacher(db, django_user_model):
    return django_user_model.objects.create_user(
        email='teacher@test.com', password='pass',
        role='TEACHER', is_active=True, is_admin=False,
    )


@pytest.fixture
def admin_user(db, django_user_model):
    return django_user_model.objects.create_user(
        email='admin@test.com', password='pass',
        role='TEACHER', is_active=True, is_admin=True,
    )


@pytest.fixture
def inactive_user(db, django_user_model):
    return django_user_model.objects.create_user(
        email='inactive@test.com', password='pass',
        role='STUDENT', is_active=False, is_admin=False,
    )


def _make_session(user, subject, days_ago=5):
    """Create a completed PracticeSession for a user."""
    from practice.models import PracticeSession
    return PracticeSession.objects.create(
        user         = user,
        subject      = subject,
        completed_at = timezone.now() - timedelta(days=days_ago),
        score        = 10,
        total_marks  = 20,
    )


# ── Audience tests ────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_all_excludes_admin_and_inactive(student, teacher, admin_user, inactive_user):
    ids = set(resolve_recipients({'audience': 'ALL'}).values_list('id', flat=True))
    assert student.id in ids
    assert teacher.id in ids
    assert admin_user.id not in ids
    assert inactive_user.id not in ids


@pytest.mark.django_db
def test_students_audience(student, teacher):
    ids = set(resolve_recipients({'audience': 'STUDENTS'}).values_list('id', flat=True))
    assert student.id in ids
    assert teacher.id not in ids


@pytest.mark.django_db
def test_teachers_audience(student, teacher):
    ids = set(resolve_recipients({'audience': 'TEACHERS'}).values_list('id', flat=True))
    assert teacher.id in ids
    assert student.id not in ids


# ── Session count filters ─────────────────────────────────────────────────────

@pytest.mark.django_db
def test_min_total_sessions(student, student2):
    from catalog.models import Subject
    subj = Subject.objects.create(name='Mathematics')
    _make_session(student, subj)
    _make_session(student, subj)  # student: 2 sessions; student2: 0

    ids = set(resolve_recipients(
        {'audience': 'STUDENTS', 'min_total_sessions': 2}
    ).values_list('id', flat=True))
    assert student.id in ids
    assert student2.id not in ids


@pytest.mark.django_db
def test_min_recent_sessions(student, student2):
    from catalog.models import Subject
    subj = Subject.objects.create(name='Physics')

    _make_session(student, subj, days_ago=5)    # within 30 days
    _make_session(student2, subj, days_ago=40)  # outside 30 days

    ids = set(resolve_recipients(
        {'audience': 'STUDENTS', 'min_recent_sessions': 1}
    ).values_list('id', flat=True))
    assert student.id in ids
    assert student2.id not in ids


@pytest.mark.django_db
def test_combined_session_filters(student, student2):
    from catalog.models import Subject
    subj = Subject.objects.create(name='Chemistry')

    # student: 3 total, 2 within 30 days
    _make_session(student, subj, days_ago=5)
    _make_session(student, subj, days_ago=10)
    _make_session(student, subj, days_ago=40)

    # student2: 2 total, 2 within 30 days — fails min_total_sessions=3
    _make_session(student2, subj, days_ago=3)
    _make_session(student2, subj, days_ago=7)

    ids = set(resolve_recipients({
        'audience': 'STUDENTS',
        'min_total_sessions':  3,
        'min_recent_sessions': 2,
    }).values_list('id', flat=True))
    assert student.id in ids
    assert student2.id not in ids


# ── Teacher subject filter ────────────────────────────────────────────────────

@pytest.mark.django_db
def test_teacher_subject_filter_match(teacher, student):
    from catalog.models import Subject, ExamBoard, ExamSeries, Question, SavedTest, SavedTestQuestion

    subj   = Subject.objects.create(name='Biology')
    board  = ExamBoard.objects.create(name='WAEC', abbreviation='WAEC')
    series = ExamSeries.objects.create(
        exam_board=board, subject=subj, year=2022, sitting='MAY_JUNE',
    )
    question = Question.objects.create(
        subject=subj, exam_series=series,
        question_number=1, question_type='OBJ', content='Q1',
    )
    saved = SavedTest.objects.create(
        teacher=teacher, title='Bio Test', format='pdf', copy_type='student',
    )
    SavedTestQuestion.objects.create(
        saved_test=saved, question=question, custom_marks=1, order=0,
    )

    ids = set(resolve_recipients(
        {'audience': 'TEACHERS', 'subject_id': subj.id}
    ).values_list('id', flat=True))
    assert teacher.id in ids
    assert student.id not in ids


@pytest.mark.django_db
def test_teacher_subject_filter_no_match(teacher):
    from catalog.models import Subject
    subj = Subject.objects.create(name='Geography')

    ids = set(resolve_recipients(
        {'audience': 'TEACHERS', 'subject_id': subj.id}
    ).values_list('id', flat=True))
    assert teacher.id not in ids


# ── Edge cases ────────────────────────────────────────────────────────────────

@pytest.mark.django_db
def test_no_duplicate_rows(student):
    """annotated queryset must not duplicate users with multiple sessions."""
    from catalog.models import Subject
    subj = Subject.objects.create(name='English Language')
    _make_session(student, subj, days_ago=1)
    _make_session(student, subj, days_ago=2)

    qs = resolve_recipients({'audience': 'STUDENTS', 'min_total_sessions': 1})
    assert qs.filter(id=student.id).count() == 1


@pytest.mark.django_db
def test_empty_params_returns_all_active_non_admin(student, teacher, admin_user, inactive_user):
    ids = set(resolve_recipients({}).values_list('id', flat=True))
    assert student.id in ids
    assert teacher.id in ids
    assert admin_user.id not in ids
    assert inactive_user.id not in ids