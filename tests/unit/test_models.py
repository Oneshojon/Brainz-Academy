"""
Unit tests: models and instance-level caching.
"""

import pytest
from django.utils import timezone
from datetime import timedelta

from tests.conftest import (
    UserFactory, UserSubscriptionFactory, SubscriptionPlanFactory,
    QuestionFactory, ChoiceFactory, TheoryAnswerFactory,
    TopicFactory, LessonNoteFactory, WorksheetFactory,
    PracticeSessionFactory, UserAnswerFactory,
)


# ---------------------------------------------------------------------------
# CustomUser — active_subscription caching
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestActiveSubscriptionCache:
    """
    active_subscription uses _active_subscription_cache (hasattr pattern)
    to avoid repeated DB hits within the same request cycle.
    """

    def test_returns_none_when_no_subscription(self, free_user):
        assert free_user.active_subscription is None

    def test_returns_subscription_when_active(self, paid_user):
        sub = paid_user.active_subscription
        assert sub is not None
        assert sub.status == 'ACTIVE'

    def test_result_cached_on_instance(self, paid_user):
        _ = paid_user.active_subscription
        assert hasattr(paid_user, '_active_subscription_cache')

    def test_cache_is_same_object_on_second_call(self, paid_user):
        sub1 = paid_user.active_subscription
        sub2 = paid_user.active_subscription
        assert sub1 is sub2   # same Python object — no second DB hit

    def test_free_user_cache_set_to_none(self, free_user):
        _ = free_user.active_subscription
        assert hasattr(free_user, '_active_subscription_cache')
        assert free_user._active_subscription_cache is None

    def test_expired_subscription_not_returned(self, db):
        """Subscription with expires_at in the past should not be active."""
        user = UserFactory()
        plan = SubscriptionPlanFactory()
        UserSubscriptionFactory(
            user=user, plan=plan, status='ACTIVE',
            expires_at=timezone.now() - timedelta(days=1),  # expired yesterday
        )
        # active_subscription filters expires_at__gt=now()
        assert user.active_subscription is None

    def test_cancelled_subscription_not_returned(self, db):
        user = UserFactory()
        plan = SubscriptionPlanFactory()
        UserSubscriptionFactory(user=user, plan=plan, status='CANCELLED')
        assert user.active_subscription is None


# ---------------------------------------------------------------------------
# CustomUser — streak logic
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestStreakLogic:

    def test_streak_starts_at_one_for_new_user(self, student):
        from practice.views import update_streak
        student.last_practice_date = None
        student.streak = 0
        update_streak(student)
        assert student.streak == 1

    def test_streak_increments_on_consecutive_day(self, student):
        from practice.views import update_streak
        student.last_practice_date = timezone.now().date() - timedelta(days=1)
        student.streak = 5
        student.save()
        update_streak(student)
        assert student.streak == 6

    def test_streak_resets_after_gap(self, student):
        from practice.views import update_streak
        student.last_practice_date = timezone.now().date() - timedelta(days=3)
        student.streak = 10
        student.save()
        update_streak(student)
        assert student.streak == 1

    def test_streak_unchanged_when_already_practiced_today(self, student):
        from practice.views import update_streak
        student.last_practice_date = timezone.now().date()
        student.streak = 7
        student.save()
        update_streak(student)
        assert student.streak == 7


# ---------------------------------------------------------------------------
# CustomUser — gender field
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestGenderField:

    def test_gender_saved_correctly(self):
        user = UserFactory(gender='F')
        user.refresh_from_db()
        assert user.gender == 'F'

    def test_gender_choices_are_valid(self):
        valid = {'M', 'F', 'O', 'N', None, ''}
        user = UserFactory()
        assert user.gender in valid

    def test_gender_can_be_null(self, db):
        user = UserFactory(gender=None)
        user.refresh_from_db()
        assert user.gender is None


# ---------------------------------------------------------------------------
# CustomUser — role helpers
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUserRoleHelpers:

    def test_is_student_true_for_student_role(self, student):
        assert student.is_student is True
        assert student.is_teacher is False

    def test_is_teacher_true_for_teacher_role(self, teacher):
        assert teacher.is_teacher is True
        assert teacher.is_student is False

    def test_subscription_status_shows_free_for_free_user(self, free_user):
        assert free_user.subscription_status == 'Free'

    def test_subscription_status_shows_plan_for_paid_user(self, paid_user):
        status = paid_user.subscription_status
        assert status != 'Free'
        assert 'Student Basic' in status or 'd left' in status


# ---------------------------------------------------------------------------
# Question model
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestQuestionModel:

    def test_obj_question_has_four_choices(self, obj_question):
        assert obj_question.choices.count() == 4

    def test_exactly_one_correct_choice(self, obj_question):
        assert obj_question.choices.filter(is_correct=True).count() == 1

    def test_theory_question_has_model_answer(self, theory_question):
        assert hasattr(theory_question, 'theory_answer')
        assert theory_question.theory_answer.content != ''

    def test_theory_answer_has_marking_guide(self, theory_question):
        assert theory_question.theory_answer.marking_guide != ''

    def test_question_belongs_to_topic(self, obj_question, topic):
        assert topic in obj_question.topics.all()

    def test_question_marks_default_to_one(self, db, subject):
        q = QuestionFactory(subject=subject)
        assert q.marks == 1

    def test_question_str_contains_question_number(self, obj_question):
        assert str(obj_question.question_number) in str(obj_question) or \
               obj_question.subject.name in str(obj_question)


# ---------------------------------------------------------------------------
# Feature flags — cache structure
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestFeatureFlagCache:
    """
    get_feature_flags() returns {key: {'enabled': bool, 'visible_to': str}}.
    Second call must hit cache, not DB.
    """

    def test_feature_flags_returns_dict(self):
        from catalog.cache_utils import get_feature_flags
        flags = get_feature_flags()
        assert isinstance(flags, dict)

    def test_flag_values_have_enabled_key(self):
        from catalog.cache_utils import get_feature_flags
        flags = get_feature_flags()
        for key, val in flags.items():
            assert 'enabled' in val, f"Flag '{key}' missing 'enabled' key"
            assert isinstance(val['enabled'], bool)

    def test_flag_values_have_visible_to_key(self):
        from catalog.cache_utils import get_feature_flags
        flags = get_feature_flags()
        for key, val in flags.items():
            assert 'visible_to' in val
            assert val['visible_to'] in ('ALL', 'STUDENT', 'TEACHER')

    def test_second_call_uses_cache(self, django_assert_num_queries):
        from catalog.cache_utils import get_feature_flags
        from django.core.cache import cache
        cache.clear()
        get_feature_flags()   # populate cache
        with django_assert_num_queries(0):
            get_feature_flags()

    def test_lesson_notes_flag_present(self):
        from catalog.cache_utils import get_feature_flags
        flags = get_feature_flags()
        assert 'lesson_notes' in flags

    def test_practice_flag_present(self):
        from catalog.cache_utils import get_feature_flags
        flags = get_feature_flags()
        assert 'practice' in flags


# ---------------------------------------------------------------------------
# LessonNote and Worksheet models
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestLessonNoteModel:

    def test_lesson_note_links_to_topic(self, lesson_note, topic):
        assert lesson_note.topic == topic

    def test_lesson_note_subject_property(self, lesson_note, subject):
        assert lesson_note.subject == subject

    def test_lesson_note_with_content_not_empty(self, lesson_note):
        assert lesson_note.ai_content != ''

    def test_lesson_note_str_contains_topic_name(self, lesson_note):
        assert lesson_note.topic.name in str(lesson_note)


@pytest.mark.django_db
class TestWorksheetModel:
    """Worksheet has OneToOne to Topic, not to LessonNote."""

    def test_worksheet_links_to_topic(self, db, topic):
        ws = WorksheetFactory(topic=topic)
        assert ws.topic == topic

    def test_worksheet_topic_is_unique(self, db, topic):
        WorksheetFactory(topic=topic)
        from django.db import IntegrityError
        with pytest.raises(IntegrityError):
            WorksheetFactory(topic=topic)   # second one should fail unique constraint

    def test_worksheet_str_contains_topic_name(self, db, topic):
        ws = WorksheetFactory(topic=topic)
        assert topic.name in str(ws)


# ---------------------------------------------------------------------------
# PracticeSession model
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPracticeSessionModel:

    def test_session_not_completed_by_default(self, db, student, subject):
        session = PracticeSessionFactory(user=student, subject=subject)
        assert session.completed_at is None
        assert session.is_completed is False

    def test_completed_session_is_completed(self, completed_session):
        assert completed_session.is_completed is True

    def test_score_percentage_calculation(self, completed_session):
        pct = completed_session.score_percentage
        assert pct == 100.0   # score == total_marks in the fixture

    def test_score_percentage_is_none_when_no_score(self, db, student, subject):
        session = PracticeSessionFactory(user=student, subject=subject, score=None)
        assert session.score_percentage is None

    def test_answers_related_name(self, completed_session):
        """UserAnswer related_name on PracticeSession is 'answers'."""
        assert completed_session.answers.count() == 1


# ---------------------------------------------------------------------------
# UserSubscription — is_active property
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUserSubscriptionIsActive:

    def test_active_status_with_future_expiry_is_active(self, db):
        user = UserFactory()
        plan = SubscriptionPlanFactory()
        sub = UserSubscriptionFactory(user=user, plan=plan, status='ACTIVE',
                                      expires_at=timezone.now() + timedelta(days=10))
        assert sub.is_active is True

    def test_expired_subscription_is_not_active(self, db):
        user = UserFactory()
        plan = SubscriptionPlanFactory()
        sub = UserSubscriptionFactory(user=user, plan=plan, status='ACTIVE',
                                      expires_at=timezone.now() - timedelta(days=1))
        assert sub.is_active is False

    def test_cancelled_subscription_is_not_active(self, db):
        user = UserFactory()
        plan = SubscriptionPlanFactory()
        sub = UserSubscriptionFactory(user=user, plan=plan, status='CANCELLED')
        assert sub.is_active is False