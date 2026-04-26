"""
ExamPrep — shared pytest fixtures and factories.

All model paths, field names and related_names verified against actual source:
  - UserSubscription is in catalog app (not payments)
  - PastPaper is in catalog app
  - Worksheet has OneToOne to Topic (not LessonNote)
  - UserAnswer related_name on PracticeSession is 'answers'
  - active_subscription cache attr is '_active_subscription_cache'
  - get_feature_flags() returns {key: {'enabled': bool, 'visible_to': str}}
  - DOCX parser is _parse_docx() (private) inside teacher/views.py
  - PDF note parser is parse_note_pdf() in catalog/note_pdf_parser.py
"""

import pytest
import factory
from django.utils import timezone
from datetime import timedelta


# ---------------------------------------------------------------------------
# Factories
# ---------------------------------------------------------------------------

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'Users.CustomUser'
        skip_postgeneration_save = True

    email      = factory.Sequence(lambda n: f'user{n}@example.com')
    first_name = factory.Sequence(lambda n: f'User{n}')
    last_name  = 'Test'
    is_active  = True
    role       = 'STUDENT'
    streak     = 0
    gender     = 'M'
    is_admin   = False

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        pwd = extracted or 'testpass123'
        self.set_password(pwd)
        if create:
            self.save(update_fields=['password'])


class AdminUserFactory(UserFactory):
    is_admin = True
    is_staff = True
    role     = 'TEACHER'


class TeacherUserFactory(UserFactory):
    email = factory.Sequence(lambda n: f'teacher{n}@example.com')
    role  = 'TEACHER'


class ExamBoardFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.ExamBoard'

    name         = factory.Sequence(lambda n: f'Board {n}')
    abbreviation = factory.Sequence(lambda n: f'BRD{n}')


class SubjectFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.Subject'

    # Subject.save() calls .title() so must not have spaces causing uniqueness issues
    name = factory.Sequence(lambda n: f'Subject{n}')


class ExamSeriesFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.ExamSeries'

    exam_board = factory.SubFactory(ExamBoardFactory)
    subject    = factory.SubFactory(SubjectFactory)
    year       = 2023
    sitting    = 'MAY_JUNE'


class ThemeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.Theme'

    subject = factory.SubFactory(SubjectFactory)
    name    = factory.Sequence(lambda n: f'Theme {n}')
    order   = factory.Sequence(lambda n: n)


class TopicFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.Topic'

    subject = factory.SubFactory(SubjectFactory)
    theme   = None
    name    = factory.Sequence(lambda n: f'Topic {n}')


class QuestionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.Question'
        skip_postgeneration_save = True  # topics uses M2M add() — no model save() needed

    content         = factory.Sequence(lambda n: f'What is question {n}?')
    question_type   = 'OBJ'
    question_number = factory.Sequence(lambda n: n + 1)
    marks           = 1
    subject         = factory.SubFactory(SubjectFactory)
    exam_series     = factory.SubFactory(ExamSeriesFactory)
    difficulty      = 'MEDIUM'

    @factory.post_generation
    def topics(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for topic in extracted:
                self.topics.add(topic)
            # M2M doesn't require save() — add() writes directly to the join table


class ChoiceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.Choice'

    question    = factory.SubFactory(QuestionFactory)
    label       = 'A'
    choice_text = factory.Sequence(lambda n: f'Choice text {n}')
    is_correct  = False


class TheoryAnswerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.TheoryAnswer'

    question      = factory.SubFactory(QuestionFactory, question_type='THEORY')
    content       = 'This is the model answer.'
    marking_guide = 'Award 1 mark for each correct point.'
    video_url     = ''


class LessonNoteFactory(factory.django.DjangoModelFactory):
    """LessonNote has OneToOne to Topic."""
    class Meta:
        model = 'catalog.LessonNote'

    topic      = factory.SubFactory(TopicFactory)
    title      = factory.Sequence(lambda n: f'Note {n}')
    ai_content = 'This is the lesson note content.'
    video_url  = None


class WorksheetFactory(factory.django.DjangoModelFactory):
    """Worksheet has OneToOne to Topic — NOT to LessonNote."""
    class Meta:
        model = 'catalog.Worksheet'

    topic      = factory.SubFactory(TopicFactory)
    title      = factory.Sequence(lambda n: f'Worksheet {n}')
    ai_content = 'Worksheet content here.'


class SubscriptionPlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'catalog.SubscriptionPlan'
        django_get_or_create = ('plan_type', 'duration')

    plan_type = 'STUDENT_BASIC'
    duration  = 'MONTHLY'
    name      = 'Student Basic — Monthly'
    price     = 3000
    is_active = True
    features  = 'Unlimited practice sessions'


class UserSubscriptionFactory(factory.django.DjangoModelFactory):
    """
    UserSubscription is in the catalog app.
    is_active property checks status='ACTIVE' AND expires_at in the future.
    """
    class Meta:
        model = 'catalog.UserSubscription'

    user       = factory.SubFactory(UserFactory)
    plan       = factory.SubFactory(SubscriptionPlanFactory)
    status     = 'ACTIVE'
    started_at = factory.LazyFunction(timezone.now)
    expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(days=30))


class PastPaperFactory(factory.django.DjangoModelFactory):
    """
    PastPaper is in catalog app.
    Subject is NOT a direct field — access via exam_series.subject.
    """
    class Meta:
        model = 'catalog.PastPaper'

    exam_series = factory.SubFactory(ExamSeriesFactory)
    paper_type  = 'OBJ'


class PracticeSessionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'practice.PracticeSession'

    user            = factory.SubFactory(UserFactory)
    session_type    = 'EXAM'
    subject         = factory.SubFactory(SubjectFactory)
    total_marks     = 10
    total_questions = 10
    score           = None
    completed_at    = None


class UserAnswerFactory(factory.django.DjangoModelFactory):
    """related_name on PracticeSession is 'answers' (not useranswer_set)."""
    class Meta:
        model = 'practice.UserAnswer'

    session         = factory.SubFactory(PracticeSessionFactory)
    question        = factory.SubFactory(QuestionFactory)
    selected_choice = None
    is_correct      = None
    theory_response = None


class BookmarkFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'practice.Bookmark'

    user     = factory.SubFactory(UserFactory)
    question = factory.SubFactory(QuestionFactory)


class QuestionCommentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = 'practice.QuestionComment'

    question  = factory.SubFactory(QuestionFactory)
    author    = factory.SubFactory(UserFactory)
    body      = 'This is a test comment.'
    is_pinned = False
    is_hidden = False


# ---------------------------------------------------------------------------
# Pytest fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def student(db):
    return UserFactory(role='STUDENT')


@pytest.fixture
def teacher(db):
    return TeacherUserFactory()


@pytest.fixture
def admin_user(db):
    return AdminUserFactory()


@pytest.fixture
def subject(db):
    return SubjectFactory(name='Physics')


@pytest.fixture
def topic(db, subject):
    return TopicFactory(name='Waves', subject=subject)


@pytest.fixture
def obj_question(db, subject, topic):
    """A complete OBJ question with 4 choices, one correct."""
    q = QuestionFactory(subject=subject, question_type='OBJ', marks=2, topics=[topic])
    ChoiceFactory(question=q, label='A', choice_text='Option A', is_correct=True)
    ChoiceFactory(question=q, label='B', choice_text='Option B', is_correct=False)
    ChoiceFactory(question=q, label='C', choice_text='Option C', is_correct=False)
    ChoiceFactory(question=q, label='D', choice_text='Option D', is_correct=False)
    return q


@pytest.fixture
def theory_question(db, subject, topic):
    """A complete THEORY question with model answer."""
    q = QuestionFactory(subject=subject, question_type='THEORY', marks=5, topics=[topic])
    TheoryAnswerFactory(question=q)
    return q


@pytest.fixture
def completed_session(db, student, subject, obj_question):
    """A fully completed practice session with one correct answer."""
    session = PracticeSessionFactory(
        user=student,
        subject=subject,
        total_questions=1,
        total_marks=obj_question.marks,
        score=obj_question.marks,
        completed_at=timezone.now(),
    )
    correct_choice = obj_question.choices.filter(is_correct=True).first()
    UserAnswerFactory(
        session=session,
        question=obj_question,
        selected_choice=correct_choice,
        is_correct=True,
    )
    return session


@pytest.fixture
def free_user(db):
    """A student with no active subscription (free tier)."""
    return UserFactory(role='STUDENT')


@pytest.fixture
def paid_user(db):
    """A student with an active STUDENT_BASIC subscription."""
    user = UserFactory(role='STUDENT')
    plan = SubscriptionPlanFactory(plan_type='STUDENT_BASIC', duration='MONTHLY')
    UserSubscriptionFactory(user=user, plan=plan)
    return user


@pytest.fixture
def lesson_note(db, topic):
    return LessonNoteFactory(topic=topic)


@pytest.fixture
def past_paper(db, subject):
    """PastPaper — subject is accessed via exam_series.subject, not directly."""
    board  = ExamBoardFactory()
    series = ExamSeriesFactory(subject=subject, exam_board=board, year=2022)
    return PastPaperFactory(exam_series=series, paper_type='OBJ')


@pytest.fixture(autouse=True)
def seed_feature_flags(db):
    """
    Seed feature flags before every test that touches the DB.
    Flags are not in migrations — they are seeded via _seed_flags().
    Without this, get_feature_flags() returns {} and flag tests fail.
    """
    from django.core.cache import cache
    from catalog.models import _seed_flags, FeatureFlag
    # Only seed if table is empty (avoid duplicate key errors)
    if not FeatureFlag.objects.exists():
        _seed_flags()
    # Always clear cache so flags are re-read from the freshly seeded DB
    cache.clear()


@pytest.fixture(autouse=True)
def disable_ssl_redirect(settings):
    """Kill SECURE_SSL_REDIRECT for every test — prevents 301 cascades."""
    settings.SECURE_SSL_REDIRECT = False


# ---------------------------------------------------------------------------
# Query count helper
# ---------------------------------------------------------------------------

from contextlib import contextmanager
from django.test.utils import CaptureQueriesContext
from django.db import connection


@contextmanager
def assert_max_queries(n):
    """
    Context manager: assert that no more than n DB queries are executed.
    Use instead of django_assert_num_queries(max_num=n) which doesn't exist.

    Usage:
        with assert_max_queries(8):
            client.get(url)
    """
    with CaptureQueriesContext(connection) as ctx:
        yield ctx
    actual = len(ctx.captured_queries)
    assert actual <= n, (
        f"Expected at most {n} queries, but {actual} were executed.\n"
        + "\n".join(f"  {i+1}. {q['sql'][:120]}" for i, q in enumerate(ctx.captured_queries))
    )


@pytest.fixture
def max_queries():
    """Fixture version of assert_max_queries for use in test methods."""
    return assert_max_queries